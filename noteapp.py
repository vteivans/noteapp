# all the imports
import os
import sqlite3
import json
import hashlib
from flask import Flask, request, session, g, redirect, url_for, abort, \
	render_template, flash, jsonify, Response

# create our little application :)
app = Flask(__name__)
app.config.from_object(__name__)

# Load default config and override config from an environment variable
app.config.update(dict(
	DATABASE=os.path.join(app.root_path, 'noteapp.db'),
	DEBUG=True,
	SECRET_KEY='development key',
	USERNAME='admin',
	PASSWORD='admin'
))
app.config.from_envvar('NOTEAPP_SETTINGS', silent=True)

# db stuff
def connect_db():
	"""Connects to the specific database."""
	rv = sqlite3.connect(app.config['DATABASE'])
	rv.row_factory = sqlite3.Row

	return rv

def init_db():
	with app.app_context():
		db = get_db()
		with app.open_resource('schema.sql', mode='r') as f:
			db.cursor().executescript(f.read())
		db.commit()

def get_db():
	"""Opens a new database connection if there is none yet for the
	current application context.
	"""
	if not hasattr(g, 'sqlite_db'):
		g.sqlite_db = connect_db()

	return g.sqlite_db

@app.teardown_appcontext
def close_db(error):
	"""Closes the database again at the end of the request."""
	if hasattr(g, 'sqlite_db'):
		g.sqlite_db.close()


""" Render the view  - notes and desktop list """
@app.route('/')
@app.route('/<desktop>')
def view_desktop(desktop=1):
	desktop = int(desktop)
	db = get_db()
	curDesktop = db.execute('SELECT id, name, ord FROM desktops ORDER BY id ASC')
	desktops = curDesktop.fetchall()
	curNotes = db.execute('SELECT id, type, desktop, content, posx, posy, width, height FROM notes WHERE desktop = ?', [desktop])
	notes = curNotes.fetchall();

	sidebar = render_template('sidebar.html', desktops=desktops, current=desktop)
	return render_template('show_entries.html', sidebar=sidebar, notes=notes)


""" if id not given creates new desktop """
@app.route('/desktops', methods=['POST','PUT'])
def create_desktop ():
	desktopAttrs = {
		'id':  None,
		'name': '',
		'ord': None,
		'current': None
	}
	errors = {}
	requestData = request.json if request.json else request.form


	""" Simple parameter validation """
	for attr in desktopAttrs:
		if attr in requestData:
			if attr == 'id':
				continue

			if attr == 'name' and not requestData[attr]:
				errors['name'] = 'attribute "name" must be set'

			desktopAttrs[attr] = requestData[attr]

		elif attr == 'name':
			errors['name'] = 'attribute "name" must be set'

	if errors:
		return Response(json.dumps({'errors': errors}), mimetype='application/json', status=400)

	db = get_db()

	""" Creating new desktop """
	cursor = db.execute('insert into desktops(name,ord) values(?,?)', [
		desktopAttrs['name'],
		desktopAttrs['ord']])
	db.commit()
	desktopAttrs['id'] = cursor.lastrowid
	desktopAttrs['url'] = url_for('view_desktop', desktop=desktopAttrs['id'])
	return jsonify(desktopAttrs)


""" If id given updates existing desktop """
@app.route('/desktops/<id>', methods=['POST','PUT'])
def update_desktop (id):
	desktopAttrs = {
		'id':  int(id),
		'name': '',
		'ord': None,
		'current': None
	}
	errors = {}
	requestData = request.json if request.json else request.form

	""" Simple parameter validation """
	for attr in desktopAttrs:
		if attr in requestData:
			if attr == 'id':
				continue

			if attr == 'name' and not requestData[attr]:
				errors['name'] = 'attribute "name" must be set'

			desktopAttrs[attr] = requestData[attr]

		elif attr == 'name':
			errors['name'] = 'attribute "name" must be set'

	if errors:
		return Response(json.dumps({'errors': errors}), mimetype='application/json', status=400)

	db = get_db()

	""" Updating existing desktop """			
	db.execute('update desktops SET name=?, ord=? where id = ?', [
		desktopAttrs['name'],
		desktopAttrs['ord'],
		desktopAttrs['id']])
	db.commit()
	desktopAttrs['url'] = url_for('view_desktop', desktop=desktopAttrs['id'])
	return jsonify(desktopAttrs)
	

""" Return list of desktops """
@app.route('/desktops', methods=['GET'])
def desktop_content_display ():
	db = get_db()

	cursor = db.execute('SELECT id, name, ord FROM desktops ORDER BY id ASC')
	desktops = cursor.fetchall()
	dlist = []

	for desk in desktops:
		dlist.append({'id': desk['id'], 'name': desk['name'], 'url': url_for('view_desktop', desktop=desk['id'])})

	return Response(json.dumps(dlist), mimetype='application/json')


""" Returns single desktop """
@app.route('/desktops/<id>', methods=['GET'])
def desktop_list_display (id):
	desktopAttrs = {
		'id': int(id),
	}
	db = get_db()

	cursor = db.execute('SELECT id, name, ord FROM desktops where id = ? ORDER BY id ASC', [
			desktopAttrs['id']])

	desktops = cursor.fetchall()
	return jsonify(desktops[0])


""" Returns all notes on a given desktop """
@app.route('/notes/desktop/<desktop_id>', methods=['GET'])
def get_notes(desktop_id):
	noteAttrs = {
		'id': None,
		'type': ['img', 'txt'],
		'desktop': int(desktop_id),
		'content': '',
		'posx': 0,
		'posy': 0,
		'width': None,
		'height': None
	}
	db = get_db()

	""" If id is not given, return all notes for this desktop """
	curNotes = db.execute('SELECT id,type,desktop,content,posx,posy,width,height FROM notes WHERE desktop = ? ORDER BY id ASC', [
		desktop_id])
	notes = curNotes.fetchall()
	nlist = []
	
	for note in notes:
		noteDict = {}

		for attr in noteAttrs:
			noteDict[attr] = note[attr]
		nlist.append(noteDict)

	return Response(json.dumps(nlist), mimetype='application/json')


""" Returns single note """
@app.route('/notes/desktop/<desktop_id>/<id>', methods=['GET'])
def get_note(desktop_id, id):
	noteAttrs = {
		'id': int(id),
		'desktop': int(desktop_id)
	}
	db = get_db()

	""" If id given return the note """
	curNotes = db.execute('SELECT id,type,desktop,content,posx,posy,width,height FROM notes where id = ? ORDER BY id ASC', [
		noteAttrs['id']])

	note = curNotes.fetchone()
	return jsonify(note)


""" Creates new note if id is not given"""
@app.route('/notes/desktop/<desktop_id>', methods=['POST','PUT'])
def create_note (desktop_id):
	noteAttrs = {
			'id': None,
			'type': ['img', 'txt'],
			'desktop': int(desktop_id),
			'content': '',
			'posx': 0,
			'posy': 0,
			'width': None,
			'height': None
		}
	errors = {}
	requestData = request.json if request.json else request.form

	""" Simple parameter validation """
	for attr in noteAttrs:

		if attr in requestData:
			if attr == 'id':
				continue

			if attr == 'type' and requestData[attr] not in noteAttrs['type']:
				errors[attr] = 'wrong note type specified, peas supply "txt" or "img"'
				continue

			if attr == 'desktop' and (1 > int(request.json['desktop']) or int(request.json[attr]) == noteAttrs[attr]):
				# errors[attr] = 'paremter "desktop" must be positiv integer'
				continue

			if (attr in ['posx', 'posy']):
				noteAttrs[attr] = max(noteAttrs[attr], requestData[attr])
			else:
				noteAttrs[attr] = requestData[attr]

		elif attr == 'type':
			errors[attr] = "parameter %s must be specified" % attr

	if errors:
		return Response(json.dumps({'errors': errors}), mimetype='application/json', status=400)
		
	db = get_db()

	""" Creating new note """
	cursor = db.execute('insert into notes(type,desktop,content,posx,posy,width,height) values(?,?,?,?,?,?,?)', [
		noteAttrs['type'],
		noteAttrs['desktop'],
		noteAttrs['content'],
		noteAttrs['posx'],
		noteAttrs['posy'],
		noteAttrs['width'],
		noteAttrs['height']])
	db.commit()
	noteAttrs['id'] = cursor.lastrowid

	return jsonify(noteAttrs)


""" Updates existing note if id is given """
@app.route('/notes/desktop/<desktop_id>/<id>', methods=['POST','PUT'])
def update_note (desktop_id, id):
	noteAttrs = {
			'id': int(id) if id else None,
			'type': ['img', 'txt'],
			'desktop': int(desktop_id),
			'content': '',
			'posx': 0,
			'posy': 0,
			'width': None,
			'height': None
		}
	errors = {}
	requestData = request.json if request.json else request.form

	""" Simple parameter validation """
	for attr in noteAttrs:

		if attr in requestData:
			if attr == 'id':
				continue

			if attr == 'type' and requestData[attr] not in noteAttrs['type']:
				errors[attr] = 'wrong note type specified, peas supply "txt" or "img"'
				continue

			if attr == 'desktop' and (1 > int(request.json['desktop']) or int(request.json[attr]) == noteAttrs[attr]):
				# errors[attr] = 'paremter "desktop" must be positiv integer'
				continue

			if (attr in ['posx', 'posy']):
				noteAttrs[attr] = max(noteAttrs[attr], requestData[attr])
			else:
				noteAttrs[attr] = requestData[attr]

		elif attr == 'type':
			errors[attr] = "parameter %s must be specified" % attr

	if errors:
		return Response(json.dumps({'errors': errors}), mimetype='application/json', status=400)
		
	db = get_db()

	""" Updating existing note """
	db.execute('update notes SET type=?,desktop=?,content=?,posx=?,posy=?,width=?,height=? where id = ?', [
		noteAttrs['type'],
		noteAttrs['desktop'],
		noteAttrs['content'],
		noteAttrs['posx'],
		noteAttrs['posy'],
		noteAttrs['width'],
		noteAttrs['height'],
		noteAttrs['id']])
	db.commit()
	return jsonify(noteAttrs)


""" Deleting note """
@app.route('/notes/desktop/<desktop_id>', methods=['DELETE'])
@app.route('/notes/desktop/<desktop_id>/<id>', methods=['DELETE'])
def delete_notes (desktop_id, id = None):
	noteAttrs = {
			'id': int(id) if id else None,
			'type': ['img', 'txt'],
			'desktop': int(desktop_id),
			'content': '',
			'posx': 0,
			'posy': 0,
			'width': None,
			'height': None
		}

	errors = {}
	if noteAttrs['id']:
		db = get_db()
		noteToRemove = db.execute('SELECT id,type,desktop,content,posx,posy,width,height FROM notes where id = ? and desktop = ? ORDER BY id ASC', [
			noteAttrs['id'],noteAttrs['desktop']])
		note = noteToRemove.fetchone()
		if note:
			db.execute('DELETE FROM notes WHERE id = ?', [note['id']])
			db.commit()
			return jsonify(note)
		else:
			errors['note'] = 'No note with id %d on desktop %d to delete' % (noteAttrs['id'], noteAttrs['desktop'])
	else:
		errors['id'] = 'Note id missing'

	return Response(json.dumps({'errors': errors}), mimetype='application/json', status=400)
		


if __name__ == '__main__':
	app.run()