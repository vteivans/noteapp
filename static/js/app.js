var Desktop = Backbone.Model.extend(),
	Desktops = Backbone.Collection.extend({
		Model: Desktop,
		url: '/desktops'
	});

var Note = Backbone.Model.extend(),
	Notes = Backbone.Collection.extend({
		Model: Note,
		url: function () {
			var desk = document.location.pathname.match(/^\/[0-9]+/);
			
			if (desk) {
				desk = desk[0].replace(/\//, '');
			} else {
				desk = 1;
			}
			return '/notes/desktop/' + desk;
		}
	});

var NoteApp = {
	desktops: new Desktops({}),
	notes: new Notes({})
}


var DesktopList = Backbone.View.extend({

	el: 'ul#desktops',

	events: {
		"blur #desktop-name-input":"newDesktop",
		"keyup #desktop-name-input":"confirmDesktop",
		'dblclick .desktop-item' : "editName"
	},

	initialize: function() {
		this.collection = NoteApp.desktops;
		this.listenTo(this.collection, "change", this.render);
		this.template = _.template('<li class="<%= active %>"><a class="desktop-item" href="<%= url %>" data-id="<%= id %>"><i class="icon">&nbsp;</i><%= name %></a></li>');
		this.editorTemplate = _.template('<li><div><i class="icon">&nbsp;</i><input id="desktop-name-input" type="text" data-id="<%= id %>" value="<%= name %>"></div></li>');
		this.$el.css('height', $(document).height() - this.$el.siblings('.top')[0].scrollHeight - this.$el.siblings('#add-desktop')[0].scrollHeight);
	},

	render: function() {
		var el = this.$el,
			template = this.template;
		el.empty();
		this.collection.each(
			function(desktop){
			var desk = desktop.toJSON(),
				elem = template({name:desk['name'], url: desk['url'], active: (desk['current'] ? 'active' : ''), id: desk['id']});
			el.append(elem);
		});
		return this;
	},

	add: function (elem) {
		this.$el.append(elem);
	},

	newDesktop: function (e) {
		if (e.target.value) {
			var desktop = new Desktop({'name': e.target.value});
			this.collection.add(desktop);
			desktop.save();
			
		}
		e.currentTarget.parentNode.parentNode.remove();
	},
	confirmDesktop: function (e) {
		if(e.which == 13) {
			$(e.target).trigger('blur');
		}
		if (e.which == 27) {
			e.target.value = '';
			$(e.target).trigger('blur');
		}
	},
	editName: function (e) {
		e.preventDefault();
		var desktop = $(e.target);
		var model = this.collection.get(desktop.data('id'));
		
		if (model) {
			var editor = $(this.editorTemplate({name: model.get('name'), id: model.get('id')}));
			desktop.parent().replaceWith(editor);
			editor.focus();
		}
	}
});


var NoteBord = Backbone.View.extend({

	el: 'div#board',
	className: 'note-wrapper',

	events: {
		"click .remove-note":"removeNote",
		"click .place-holder":"editContent",
		"blur .place-holder":"setContent",
		"dblclick .note-content" : "editContent",
		"keyup .note":"cancelEdit",
	},

	initialize: function() {
		// this.collection = NoteApp.desktops;
		this.listenTo(this.collection, "change:id remove", this.render);
		this.template = _.template('<div class="note note-<%= type %> <%= class_name %>" style="left:<%= posx %>px;top:<%= posy %>px;" data-id="<%= note_id %>"><a href="javascript:;" class="remove-note">x</a><%= content %></div>');
		this.templatePlaceHolder = _.template('<span class="place-holder"><%= text %></span>');
		this.templateContentTxt = _.template('<span class="note-content"><%= content %></span>');
		this.templateContentImg = _.template('<img class="note-content" src="<%= content %>" width="<%= width %>" height="<%= height %>">');
		this.placeHolderTxt = 'enter your text';
		this.placeHolderImg = 'image url here';

	},

	render: function() {
		var el = this.$el,
			template = this.template,
			self = this;

		el.empty();
		this.collection.each(
			function(note){
				var nte = note.toJSON();
				var content = '';

				switch (nte['type']) {

					case 'img':
						if (nte['content']) {
							content = self.templateContentImg({
								content: nte['content'], 
								width: (nte['width'] ? nte['width'] : ''), 
								height: (nte['height'] ? nte['height'] : '')
							});
							nte['class_name'] = '';
						} else {
							content = self.templatePlaceHolder({text: self.placeHolderImg});
							nte['class_name'] = 'empty';
						}
						break;

					case 'txt':
						if (nte['content']) {
							content = self.templateContentTxt({content: nte['content']});
							nte['class_name'] = '';
						} else {
							content = self.templatePlaceHolder({text: self.placeHolderTxt});
							nte['class_name'] = 'empty';
						}
						break;

					default:
						return;

				}

				var elem = template({
					note_id: nte['id'],
					type: nte['type'],
					class_name: nte['class_name'],
					posx: nte['posx'],
					posy: nte['posy'],
					content: content
				});

				var node = $(elem);

				el.append(node);

				node.draggable({
					containment: 'parent',
					cursor: 'move',
					revert: 'invalid',
					stop: function (v) {
						var elem = $(this);
						var note = NoteApp.notes.get(elem.data('id'));
						note.set('posx', this.offsetLeft);
						note.set('posy', this.offsetTop);
						note.save();

					}
				});
			});
		return this;
	},

	add: function (elem) {
		this.$el.append(elem);
	},

	removeNote: function(event) {
		var noteNode = $(event.target.parentNode),
			note = this.collection.get(noteNode.data('id'));

		if (note.get('content')) {
			if (confirm('Delete the note?')) {
				note.destroy();
			}
		} else {
			note.destroy();
		}
	},
	editContent: function(event) {
		var node = $(event.target),
			note = node.parent();


		if (node.hasClass('place-holder')) {
			node.attr('contenteditable', true);
			node.html('');
			node.focus();
		} else if (node.hasClass('note-content')) {
			var placeHolder;

			if (note.hasClass('note-img')) {
				placeHolder = $(this.templatePlaceHolder({text: node.attr('src')}));
			} else {
				placeHolder = $(this.templatePlaceHolder({text: node.text()}));
			}

			node.remove();
			placeHolder.appendTo(note);
			placeHolder.attr('contenteditable', true);
			placeHolder.on('blur',this.setContent);
			placeHolder.focus();
			placeHolder.select();
		}
	},
	setContent: function (event) {
		var node = $(event.target),
			note = node.parent(),
			content = $.trim(node.text()),
			model = NoteApp.notes.get(note.data('id'));



			if (model) {

				if (note.hasClass('note-img')) {
					var img = document.createElement('img');

					img.src = content;
					img = $(img);
					node.remove();
					note.append(img);

					if (img.width() / img.height() > 1) {
						model.set('height', note.height());
					} else {
						model.set('width', note.width());
					}
				}

				model.set('content', content);
				model.save();
				NoteApp.bord.render();
			}
	},
	cancelEdit: function(e) {
		if (e.which == 27) {
			this.render();
		}
	}
});


var Controls = Backbone.View.extend({

	tagName: 'div',
	id: 'controls',
	className: 'controls',

	events: {
		"click .note-create.note-txt":"textNote",
		"click .note-create.note-img":"imageNote",
	},

	initialize: function() {
		this.template = _.template('<a class="note-create note-<%= type %>" href="#"><%= text %></a>');
		this.render();
	},

	render: function() {
		var el = this.$el,
			template = this.template;
		el.empty();

		var txt = $(template({type: 'txt', text: 'Txt'}));
		var img = $(template({type: 'img', text: 'Img'}));

		txt.draggable({
			revert: true,
			helper: 'clone',
			appendTo: 'body',
			zIndex: 100
		});

		img.draggable({
			revert: true,
			helper: 'clone',
			appendTo: 'body',
			zIndex: 100
		});

		el.append(txt);
		el.append(img);
		return this;
	},

	textNote: function () {
		note = new Note({
			content: '',
			posx: 250,
			posy: 20,
			type: 'txt'
		});
		NoteApp.notes.add(note);
		note.save();
	},

	imageNote: function () {
		note = new Note({
			content: '',
			posx: 280,
			posy: 40,
			type: 'img'
		});
		NoteApp.notes.add(note);
		note.save();
	}
});



$(function() {
	
	
	NoteApp.desktops.fetch({
		success: function (data) {
			NoteApp.desktopList = new DesktopList({collection: NoteApp.desktops});		
		}
	});
	
	NoteApp.notes.fetch({
		success: function (data) {
			NoteApp.bord = new NoteBord({collection: NoteApp.notes});

			$('#board .note').draggable({
				containment: 'parent',
				cursor: 'move',
				revert: 'invalid',
				zIndex: 100,
				stop: function (v) {
					var elem = $(this);
					var note = NoteApp.notes.get(elem.data('id'));
					note.set('posx', this.offsetLeft);
					note.set('posy', this.offsetTop);
					note.save();

				}
			});

			$('#board').droppable({
				drop: function (event, ui) {
					var offset = this.offsetLeft;

					if (ui.draggable.hasClass('note-create')) {
						if (ui.helper.offset().left < offset) {
							return false;
						}
						var note = {
							content: '',
							posx: ui.helper.offset().left - offset,
							posy: ui.helper.offset().top - offset
						};

						if (ui.draggable.hasClass('note-img')) {
							note['type'] = 'img';	
						} else {
							note['type'] = 'txt';
						}

						note = new Note(note);
						NoteApp.notes.add(note);
						note.save();
					}
				}
			});
		}
	});

	NoteApp.controls = new Controls();

	// NoteApp.desktopList.render();
	// NoteApp.bord.render();

	var sidebar = $('#sidebar');
	sidebar.children('.top').append(NoteApp.controls.el);

	var addDesktop = $('<a id="add-desktop" class="add-desktop" href="#">').html('+');
	addDesktop.click(function (e) {
		e.preventDefault();
		template = _.template('<li><div><i class="icon">&nbsp;</i><input id="desktop-name-input" type="text"></div></li>');
		NoteApp.desktopList.add(template);
		$('#desktop-name-input').focus();
	});
	sidebar.append(addDesktop);

	

	$('#sidebar').droppable({
		greedy: true,
		drop: function (event, ui) {
			return false;
		}
	});
});
 

