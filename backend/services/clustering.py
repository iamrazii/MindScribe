import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import select, func, delete
from sklearn.cluster import AgglomerativeClustering
from models.entity import Clusters, Notes
from services.llm import ChatService
import concurrent.futures

class ClusterService:
    def __init__(self, db: Session, user_id):
        self.db = db
        self.user_id = user_id
        self.DISTANCE_THRESHOLD = 0.50 
        self.MIN_NOTES_FOR_MITOSIS = 8     
        self.MITOSIS_SPLIT_THRESHOLD = 0.25   

    def AssignCluster(self, title: str, content: str, document_vector: list[float]) -> int:
        distance_col = Clusters.cluster_vector.cosine_distance(document_vector).label("distance")
        stmt = (
            select(Clusters, distance_col)
            .where(Clusters.user_id == self.user_id)
            .order_by(distance_col)
            .limit(1)
        )
        result = self.db.execute(stmt).first()

        if result and result.distance < self.DISTANCE_THRESHOLD:
            best_cluster = result[0] 
            
            current_note_count = self.db.execute(
                select(func.count(Notes.id)).where(Notes.cluster_id == best_cluster.id)
            ).scalar() or 0

            old_centroid = np.array(best_cluster.cluster_vector)
            new_vector = np.array(document_vector)
            
            updated_centroid = ((old_centroid * current_note_count) + new_vector) / (current_note_count + 1)
            best_cluster.cluster_vector = updated_centroid.tolist()
            
            self.db.flush() 
            return best_cluster.id
            
        else:
            print(" Asking Groq to name the new cluster...")
            chat = ChatService()
            smart_name = chat.generate_cluster_name([
                {"title": title, "content": content}
            ])
            print(f"✅ Groq named the cluster: '{smart_name}'")
            new_cluster = Clusters(
                user_id=self.user_id,
                name=smart_name,
                description=content,
                cluster_vector=document_vector
            )
            self.db.add(new_cluster)
            self.db.flush()
            return new_cluster.id
        
    def garbage_collect(self, cluster_id) -> bool:
        remaining_note = self.db.execute(
            select(Notes).where(Notes.cluster_id == cluster_id).limit(1)
        ).scalar_one_or_none()

        if not remaining_note:
            self.db.execute(
                delete(Clusters).where(Clusters.id == cluster_id, Clusters.user_id == self.user_id)
            )
            self.db.flush()
            print(f"Garbage Collection: Deleted empty cluster {cluster_id}")
            return True
        return False

    def DivideCluster(self, cluster_id) -> bool:
        cluster = self.db.execute(
            select(Clusters).where(Clusters.id == cluster_id, Clusters.user_id == self.user_id)
        ).scalar_one_or_none()
        
        if not cluster:
            print(" Abort: Cluster not found in the database.")
            return False
            
        if len(cluster.notes) < self.MIN_NOTES_FOR_MITOSIS:
            print(f" Abort: Cluster '{cluster.name}' only has {len(cluster.notes)} notes. Needs {self.MIN_NOTES_FOR_MITOSIS} to trigger split analysis.")
            return False 

        valid_notes, X_array = self._extract_pooled_vectors(cluster)
        
        if len(valid_notes) < self.MIN_NOTES_FOR_MITOSIS:
            print(f" Abort: Found enough notes, but only {len(valid_notes)} had valid vectors.")
            return False

        labels, centroid_0, centroid_1, distance = self._calculate_cluster_split(X_array)

        if distance < self.MITOSIS_SPLIT_THRESHOLD:
            print(f" Abort: Cluster '{cluster.name}' notes are too semantically similar. (Distance: {distance:.3f} is less than threshold {self.MITOSIS_SPLIT_THRESHOLD})")
            return False 

        print(f" CLuster division triggered for '{cluster.name}'! (Distance: {distance:.3f})")
        
        self._execute_split_in_db(cluster, centroid_0, centroid_1, labels, valid_notes)
        return True

    def _extract_pooled_vectors(self, cluster):
        note_vectors = []
        valid_notes = []
        
        for note in cluster.notes:
            if note.chunks:
                chunk_embeddings = [chunk.embedding for chunk in note.chunks]
                averaged_note_vector = np.mean(chunk_embeddings, axis=0)
                
                note_vectors.append(averaged_note_vector)
                valid_notes.append(note)
                
        return valid_notes, np.array(note_vectors)

    def _calculate_cluster_split(self, X: np.ndarray):
        agglo = AgglomerativeClustering(n_clusters=2, metric='cosine', linkage='average').fit(X)
        
        group_0_vectors = X[agglo.labels_ == 0]
        group_1_vectors = X[agglo.labels_ == 1]
        
        centroid_0 = np.mean(group_0_vectors, axis=0)
        centroid_1 = np.mean(group_1_vectors, axis=0)

        dot_product = np.dot(centroid_0, centroid_1)
        norm_a = np.linalg.norm(centroid_0)
        norm_b = np.linalg.norm(centroid_1)
        distance = 1 - (dot_product / (norm_a * norm_b))
        
        return agglo.labels_, centroid_0, centroid_1, distance

    def _execute_split_in_db(self, original_cluster, centroid_0, centroid_1, labels, valid_notes):
        group_0_data = [{"title": n.title, "content": n.content} for idx, n in enumerate(valid_notes) if labels[idx] == 0]
        group_1_data = [{"title": n.title, "content": n.content} for idx, n in enumerate(valid_notes) if labels[idx] == 1]
        
        print("🌐 Dispatching parallel threads to Groq for Mitosis naming...")
        chat = ChatService()

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future_0 = executor.submit(chat.generate_cluster_name, group_0_data)
            future_1 = executor.submit(chat.generate_cluster_name, group_1_data)
            
            name_0 = future_0.result()
            name_1 = future_1.result()
            
        print(f"✅ Groq split names generated: '{name_0}' and '{name_1}'")
        
        original_cluster.name = name_0
        original_cluster.cluster_vector = centroid_0.tolist()

        new_cluster = Clusters(
            user_id=self.user_id,
            name=name_1,
            description="Auto-generated via Agglomerative Mitosis",
            cluster_vector=centroid_1.tolist()
        )
        self.db.add(new_cluster)
        self.db.flush()

        for idx, label in enumerate(labels):
            if label == 1:
                valid_notes[idx].cluster_id = new_cluster.id

        self.db.commit()