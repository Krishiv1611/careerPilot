import os
import sys

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

try:
    from agents.graph import build_careerpilot_graph
    print("Building graph...")
    app = build_careerpilot_graph()
    print("Graph built successfully.")
    print(f"Graph Nodes: {app.nodes }") 
    # Graph 'compiled' generic object might not expose edges easily publicly depending on version
    # but successful compile means edges are there.
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"Error building graph: {e}")
