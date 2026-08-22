
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.deps import get_current_user
from db.session import get_db
from models.entity import Clusters, Notes, Users
from schemas.cluster_schema import ClusterOut

router = APIRouter()


@router.get("", response_model=List[ClusterOut])
def list_clusters(
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    """
    Returns all clusters that contain at least one note belonging to this user.
    Note counts are scoped to the user's own notes only.
    """
    # Find cluster IDs that have notes for this user
    user_cluster_ids = (
        db.execute(
            select(Notes.cluster_id).where(Notes.user_id == user.id).distinct()
        )
        .scalars()
        .all()
    )

    if not user_cluster_ids:
        return []

    clusters = (
        db.execute(select(Clusters).where(Clusters.id.in_(user_cluster_ids)))
        .scalars()
        .all()
    )

    result = []
    for c in clusters:
        note_count = db.execute(
            select(Notes).where(Notes.cluster_id == c.id, Notes.user_id == user.id)
        ).scalars().all()
        result.append(
            ClusterOut(
                id=c.id,
                name=c.name,
                description=c.description,
                note_count=len(note_count),
            )
        )

    return result
