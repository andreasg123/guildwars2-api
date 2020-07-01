# -*- coding: utf-8 -*-

from flask import Flask
import os


def create_app(test_config=None):
    app = Flask(__name__)
    if test_config is not None:
        app.config.from_mapping(test_config)
    if app.config['TESTING']:
        from . import gw2cache
        tests_data = os.path.realpath(os.path.join(os.path.dirname(__file__),
                                                   '../tests/data'))
        db_path = os.path.join(tests_data, 'cache.db')
        try:
            os.unlink(db_path)
        except FileNotFoundError:
            pass
        gw2cache.setDBPath(db_path)
    from . import views
    app.register_blueprint(views.bp)
    return app
