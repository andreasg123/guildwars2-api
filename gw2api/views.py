# -*- coding: utf-8 -*-

import configparser
from flask import Blueprint, jsonify, request
import os

from . import achievements
from . import bank
from . import characters
from . import skins
from . import wallet

bp = Blueprint('views', __name__)


@bp.route('/get-achievements')
def get_achievements():
    api_key = get_key('progression')
    data = achievements.get_achievements(api_key)
    # gzip of output takes about 2 seconds but only saves 1 second transfer time
    return jsonify(data)


@bp.route('/get-characters')
def get_characters():
    api_key = get_key('characters')
    data = characters.get_characters(api_key)
    return jsonify(data)


@bp.route('/get-inventory')
def get_inventory():
    api_key = get_key('characters_inventories')
    name = request.args.get('name')
    data = characters.get_inventory(api_key, name)
    return jsonify(data)


@bp.route('/get-equipment')
def get_equipment():
    api_key = get_key('characters_inventories')
    name = request.args.get('name')
    data = characters.get_equipment(api_key, name)
    return jsonify(data)


@bp.route('/get-shared')
def get_shared():
    api_key = get_key('characters_inventories')
    data = characters.get_shared(api_key)
    return jsonify(data)


@bp.route('/get-wallet')
def get_wallet():
    api_key = get_key('wallet')
    data = wallet.get_wallet(api_key)
    return jsonify(data)


@bp.route('/get-bank')
def get_bank():
    api_key = get_key('inventories')
    data = bank.get_bank(api_key)
    return jsonify(data)


@bp.route('/get-materials')
def get_materials():
    api_key = get_key('inventories')
    data = bank.get_materials(api_key)
    return jsonify(data)


@bp.route('/get-skins')
def get_skins():
    api_key = get_key('unlocks')
    data = skins.get_skins(api_key)
    return jsonify(data)


@bp.route('/get-recipe-skins')
def get_recipe_skins():
    api_key = get_key('unlocks')
    data = skins.get_skins(api_key, True)
    return jsonify(data)


def get_key(permission):
    # Separate multiple permissions by '_', sorted alphabetically
    api_key = request.args.get('key')
    if not api_key:
        config = configparser.ConfigParser()
        config.read(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                                 'keys.ini'))
        try:
            api_key = config['keys'].get(permission)
        except KeyError:
            return None
    return api_key
