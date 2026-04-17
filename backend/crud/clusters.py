from sqlalchemy.orm import Session
from sqlalchemy import select
from models.entity import Clusters

def create_cluster(db: Session, name: str, description: str, vector: list[float]):

    new_cluster = Clusters(
        name=name,
        description=description,
        cluster_vector=vector
    )
    db.add(new_cluster)
    db.flush() # Gets the new_cluster.id without committing the whole transaction yet
    return new_cluster

def get_cluster_by_id(db: Session, cluster_id):
    return db.execute(select(Clusters).where(Clusters.id == cluster_id)).scalar_one_or_none()