var NoteBoard = new Marionette.Application(); 
NoteBoard.addRegions({
	boardRegion: "#board-region"
});

var DesktopList = Backbone.View.extend({

	el: 'ul#desktops',

	events: {
		"blur #desktop-name-input":"newDesktop",
		"keyup #desktop-name-input":"confirmDesktop",
		'dblclick .desktop-item' : "editName"
	},

	initialize: function() {
		// this.collection = NoteBoard.desktops;
		this.listenTo(this.collection, "change", this.render);
		this.template = _.template('<li class="<%= active %>"><a class="desktop-item" href="<%= url %>" data-id="<%= id %>"><i class="icon">&nbsp;</i><%= name %></a></li>');
		this.editorTemplate = _.template('<li><div><i class="icon">&nbsp;</i><input id="desktop-name-input" type="text" data-id="<%= id %>" value="<%= name %>"></div></li>');
		$(window).on("resize", _.bind(this.resize, this));
		this.resize();
	},

	resize: function (e) {
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


var Controls = Backbone.View.extend({

	tagName: 'div',
	id: 'controls',
	className: 'controls',

	events: {
		"click .note-create.note-txt":"textNote",
		"click .note-create.note-img":"imageNote",
	},

	initialize: function() {
		this.template = _.template('<a class="note-create note-<%= type %>" data-type="<%= type %>" href="#"><%= text %></a>');
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
		var note = new NoteBoard.Entities.Note({
			content: '',
			posx: 250,
			posy: 20,
			type: 'txt'
		});
		NoteBoard.notes.add(note);
		note.save();
	},

	imageNote: function () {
		var note = new NoteBoard.Entities.Note({
			content: '',
			posx: 280,
			posy: 40,
			type: 'img'
		});
		NoteBoard.notes.add(note);
		note.save();
	}
});

NoteBoard.on('start', function () {

	var desktops = NoteBoard.request("desktop:entities", function(data) {
		NoteBoard.desktopList = new DesktopList({collection: desktops});
	});

	var desk = document.location.pathname.match(/^\/[0-9]+/);
	if (desk) {
		desk = desk[0].replace(/\//, '');
	} else {
		desk = 1;
	}

	NoteBoard.Board.Controller.displayNotes(desk);


	NoteBoard.controls = new Controls();

	var sidebar = $('#sidebar');
	sidebar.children('.top').append(NoteBoard.controls.el);

	var addDesktop = $('<a id="add-desktop" class="add-desktop" href="#">').html('+');
	addDesktop.click(function (e) {
		e.preventDefault();
		template = _.template('<li><div><i class="icon">&nbsp;</i><input id="desktop-name-input" type="text"></div></li>');
		NoteBoard.desktopList.add(template);
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

