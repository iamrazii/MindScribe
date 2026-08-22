from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import select
from models.entity import Clusters

def create_cluster(db: Session, user_id, name: str, description: str, vector: list[float]):
    new_cluster = Clusters(
        user_id=user_id,
        name=name,
        description=description,
        cluster_vector=vector
    )
    db.add(new_cluster)
    db.flush()
    return new_cluster

def get_cluster_by_id(db: Session, cluster_id, user_id):
    return db.execute(
        select(Clusters).where(Clusters.id == cluster_id, Clusters.user_id == user_id)
    ).scalar_one_or_none()

def get_user_clusters(db: Session, user_id) -> List[Clusters]:

    stmt = select(Clusters).where(Clusters.user_id == user_id)
    return db.execute(stmt).scalars().all()