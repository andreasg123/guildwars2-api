import os
import sys
sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))
from gw2api import create_app

application = create_app()
