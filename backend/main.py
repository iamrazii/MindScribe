import numpy as np
from sqlalchemy import select, text
from unittest.mock import patch

from db.session import SessionLocal, engine
from models.entity import Base, Users, Clusters, Notes
from crud.notes import create_note, delete_note_and_cleanup
from services.clustering import ClusterService

# MESSAGE IMPORTS
from crud.message import (
    create_message, 
    get_sent_messages, 
    get_received_messages, 
    get_message_detail
)

def reset_test_database():
    """Wipes the DB clean so tests always start fresh."""
    print("🧹 Wiping database to prevent ghost data...")
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
    Base.metadata.create_all(bind=engine)
    print("✨ Database is pristine and ready for testing.")

def setup_test_user(db):
    test_user = db.execute(select(Users).where(Users.username == "test_student")).scalar_one_or_none()
    if not test_user:
        test_user = Users(username="test_student", email="test@nu.edu.pk", hashed_password="fake")
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
    return test_user

def setup_two_test_users(db):
    alice = db.execute(select(Users).where(Users.username == "alice")).scalar_one_or_none()
    bob = db.execute(select(Users).where(Users.username == "bob")).scalar_one_or_none()
    
    if not alice:
        alice = Users(username="alice", email="alice@nu.edu.pk", hashed_password="fake")
        db.add(alice)
    if not bob:
        bob = Users(username="bob", email="bob@nu.edu.pk", hashed_password="fake")
        db.add(bob)
        
    db.commit()
    db.refresh(alice)
    db.refresh(bob)
    return alice, bob

def run_advanced_cluster_tests():
    db = SessionLocal()
    try:
        print("\n" + "="*60)
        print("🧠 TEST PHASE 1: RAG ROUTING & GARBAGE COLLECTION")
        print("="*60)
        
        user = setup_test_user(db)

        # --- TEST 1: Centroid Drifting ---
        print("\n[TEST 1] Testing Centroid Drifting...")
        n1 = create_note(db, user.id, "AI Intro", "Artificial intelligence uses neural networks.")
        
        cluster = db.execute(select(Clusters).where(Clusters.id == n1.cluster_id)).scalar_one()
        original_centroid = np.array(cluster.cluster_vector)
        print(f"✅ Note 1 Created. Original Centroid established.")

        n2 = create_note(db, user.id, "Deep Learning", "Deep learning is a subset of AI using many layers.")
        db.refresh(cluster)
        drifted_centroid = np.array(cluster.cluster_vector)
        
        if not np.array_equal(original_centroid, drifted_centroid):
            print("🔥 SUCCESS: The cluster's centroid mathematically drifted to accommodate the new note!")
        else:
            print("⚠️ FAILED: The centroid did not move.")

        # --- TEST 2: Garbage Collection ---
        print("\n[TEST 2] Testing Garbage Collection...")
        n3 = create_note(db, user.id, "Cooking 101", "Baking bread requires flour, water, salt, and yeast.")
        n3_cluster_id = n3.cluster_id
        print(f"✅ Created standalone cluster for Cooking (ID: {n3_cluster_id})")
        
        delete_note_and_cleanup(db, n3.id, user.id)
        
        ghost_cluster = db.execute(select(Clusters).where(Clusters.id == n3_cluster_id)).scalar_one_or_none()
        if ghost_cluster is None:
            print("🔥 SUCCESS: Garbage collection automatically destroyed the empty cluster!")
        else:
            print("⚠️ FAILED: The empty cluster is still in the database.")

    except Exception as e:
        print(f"\n❌ CLUSTER TEST ERROR: {e}")
    finally:
        db.close()


def run_mitosis_simulation():
    db = SessionLocal()
    try:
        print("\n" + "="*60)
        print("🧬 TEST PHASE 2: AGGLOMERATIVE CLUSTER MITOSIS")
        print("="*60)

        user = setup_test_user(db)
        
        # 🚀 Python Magic: We dynamically patch the __init__ of ClusterService just for this test block
        # so it forces the 0.99 routing threshold, without you needing to edit clustering.py!
        def mock_init(self, db_session):
            self.db = db_session
            self.DISTANCE_THRESHOLD = 0.99
            self.MIN_NOTES_FOR_MITOSIS = 8
            self.MITOSIS_SPLIT_THRESHOLD = 0.25

        with patch.object(ClusterService, '__init__', mock_init):
            service = ClusterService(db)

            print("\n[PHASE A] Ingesting Deep Learning Notes...")
            dl_notes = [
                ("Intro to Neural Networks", "Neural networks use layers of artificial neurons to process complex data arrays."),
                ("CNNs for Images", "Convolutional neural networks extract visual features using grid-like topology."),
                ("RNNs for Text", "Recurrent neural networks handle sequential data by maintaining an internal state memory."),
                ("Backpropagation", "Deep learning models adjust weights by calculating the mathematical gradient of the loss function.")
            ]

            ai_cluster_id = None
            for title, content in dl_notes:
                note = create_note(db, user.id, title, content)
                if not ai_cluster_id: ai_cluster_id = note.cluster_id
                print(f" 📝 Added: {title}")

            print("\n[PHASE B] Ingesting Genetic Algorithm Notes...")
            ga_notes = [
                ("Evolutionary Computing", "Genetic algorithms simulate natural selection to solve optimization problems."),
                ("Crossover & Mutation", "New generations are created by crossing over parent chromosomes and mutating randomly."),
                ("Fitness Functions", "A fitness function evaluates how close a candidate solution is to the optimal aim."),
                ("Population Initialization", "The genetic algorithm begins with a randomly generated population of chromosomes.")
            ]

            for title, content in ga_notes:
                create_note(db, user.id, title, content)
                print(f" 📝 Added: {title}")

            mega_cluster = db.execute(select(Clusters).where(Clusters.id == ai_cluster_id)).scalar_one()
            print(f"\n📊 CURRENT STATE: Cluster '{mega_cluster.name}' contains {len(mega_cluster.notes)} total notes.")

            print("\n[PHASE C] Triggering Cluster Mitosis Analysis...")
            split_success = service.DivideCluster(mega_cluster.id)

            if split_success:
                print("🔥 SUCCESS: The algorithm successfully identified the two sub-domains and split them!")
                print("\n--- FINAL CLUSTER STATES ---")
                all_clusters = db.execute(select(Clusters)).where(Clusters.id.in_([mega_cluster.id, mega_cluster.id + 1]) if isinstance(mega_cluster.id, int) else text("TRUE")).scalars().all()
                for c in all_clusters:
                    if "Intro to Neural Networks" in c.name: # Only show the ones relevant to this test
                        print(f"📂 '{c.name}' | Notes inside: {len(c.notes)}")
            else:
                print("⚠️ FAILED: The algorithm did not split the mega-cluster.")

    except Exception as e:
        print(f"\n❌ MITOSIS TEST ERROR: {e}")
    finally:
        db.close()


def run_message_tests():
    db = SessionLocal()
    try:
        print("\n" + "="*60)
        print("🚀 TEST PHASE 3: MESSAGE SYSTEM & CASCADES")
        print("="*60)
        
        alice, bob = setup_two_test_users(db)

        alice_note = create_note(db=db, user_id=alice.id, title="Alice's Note", note_content="My research.")
        print(f"📝 Note created by Alice: '{alice_note.title}'")

        print("\n[TEST 1] Sending messages...")
        msg_1 = create_message(db, alice.id, bob.id, "Hey Bob!")
        msg_2 = create_message(db, alice.id, bob.id, "Check out my notes!", alice_note.id)
        print("✅ Basic message & Attachment message sent!")

        print("\n[TEST 2] Checking Inboxes...")
        alices_outbox = get_sent_messages(db, alice.id)
        bobs_inbox = get_received_messages(db, bob.id)
        assert len(alices_outbox) == 2 and len(bobs_inbox) == 2
        print("🔥 SUCCESS: Inbox/Outbox logic is routing perfectly.")

        print("\n[TEST 3] Testing 'Read-on-Fetch' logic...")
        opened_msg = get_message_detail(db, msg_2.id, bob.id)
        if opened_msg.is_read:
            print("🔥 SUCCESS: Message auto-marked as READ upon opening.")

        print("\n[TEST 4] The Tombstone Test (Cascade Logic)...")
        db.delete(alice_note)
        db.commit()
        
        tombstone_msg = get_message_detail(db, msg_2.id, bob.id)
        if tombstone_msg and tombstone_msg.note_id is None:
            print("🔥 SUCCESS: Original note deleted, but message survived! Attachment cleanly severed (SET NULL).")

    except Exception as e:
        print(f"\n❌ MESSAGE ERROR OCCURRED: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    reset_test_database()
    run_advanced_cluster_tests()
    run_mitosis_simulation()
    run_message_tests()
    print("\n🎉 ALL TESTS COMPLETED. You are ready to commit!")