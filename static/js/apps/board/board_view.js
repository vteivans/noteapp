NoteBoard.module("Board", function (Board, NoteBoard, Backbone, Marionette, $, _) {

	Board.NoteView = Marionette.ItemView.extend({
		bind: this,
		tagName: 'div',
		className: 'note',

		templateBase: _.template('<a href="javascript:;" class="remove-note">x</a><%= content %>'),
		template: _.template('<a href="javascript:;" class="remove-note">x</a><%= content %>'),
		templatePlaceHolder: _.template('<span class="place-holder"><%= place_holder %></span>'),
		templateEdit: _.template('<a href="javascript:;" class="remove-note">x</a><textarea class="note-content"><%= content %></textarea>'),

		templateContent: {
			img: '<img class="note-content" src="<%= content %>" width="" height="">',
			txt: '<span class="note-content"><%= content %></span>'
		},
		placeHolder: {
			img: 'image url here',
			txt: 'enter your text'
		},
		dontRender: false,

		events: {
			"dragstop": "noteDroped",
			"click .remove-note":"removeNote",
			"click .place-holder":"editContent",
			"blur textarea.note-content":"setContent",
			"dblclick .note-content" : "editContent",
			"keyup textarea.note-content":"cancelEdit"
		},

		/* Inicializējot piezīmes skatu, piesaista to jau uzzīmētai piezīmei, ja tāda eksistē. */
		initialize: function () {
			/* Šeit this.el jau ir radīts */
			
			/* defining template for this view */
			this.initTemplate();


			if (typeof this.options.el == 'undefined' || !this.options.el) {
				var el = $('#board ' + this.tagName + '.' + this.el.className.trim().replace(/ /g, '.') + '[data-id=' + this.model.get('id') + ']' );
				
				if (el.length) {
					this.setElement(el);
					this.options.el = el;
					this.dontRender = true;
				}
			}

			/* Making notes draggable */
			this.$el.draggable({
					containment: 'parent',
					cursor: 'move'
			});
			this.$el.css('position','');

			if (this.dontRender) {
				return this;
			}

			this.$el.addClass('note-' + this.model.get('type'));

			this.$el.css({
				left: this.model.get('posx') + "px",
				top: this.model.get('posy') + "px"
			});

			this.$el.data('id',this.model.get('id'));
		},

		/* Nosaka kādu ietvaru lietot zīmējot piezīmi */
		initTemplate: function () {
			
			if (this.model.get('content')) {
				this.template = _.template(this.templateBase({
					content: this.templateContent[this.model.get('type')]
				}));
				this.$el.removeClass('empty');

			} else {
				this.$el.addClass('empty');
				this.template = _.template(this.templateBase({
					content: this.templatePlaceHolder({place_holder: this.placeHolder[this.model.get('type')]})
				}))
			}
		},

		/* Pārada vai piezīmi vajag zīmēt, ja nevajag, tad nezīmē */
		render: function () {

			if (this.dontRender) {
				this.triggerMethod('before:render', this);	
				this.dontRender = false;
				console.log('not rendering childView');
				this.triggerMethod('render', this);

				return this;
			}

			console.log('rendering childView');
			return Marionette.ItemView.prototype.render.call(this);
		},

		onRender: function () {
			return;
		},

		/* rada animāciju dzēšot piezīmi */
		remove: function () {
			var self = this;

			this.$el.fadeOut(function () {
				/* right way to call remove views item, to unbind events and garbage collect */
				return Marionette.ItemView.prototype.remove.call(self);
			});
		},

		/* Event functions */
		/* piezīmes pārvietošana */
		noteDroped: function (e, ui) {

			this.model.set('posx', ui.position.left);
			this.model.set('posy', ui.position.top);
			this.model.save();
		},

		/* Piezīmes dzēšana */
		removeNote: function (e) {
			e.stopPropagation();

			// triggers delete event for controller to catche
			this.trigger("note:remove", this.model);
		},

		/* Piezīmes rediģēšana */
		editContent: function (e) {
			/* trigger editMe event, render edit view in controller */
			e.stopPropagation();
			var currentTemplate = this.template;
			this.template = this.templateEdit;
			this.render();
			this.$el.children('textarea.note-content').focus();
			this.template = currentTemplate;

		},

		/* Piezīmes satura saglabāšana */
		setContent: function (e) {
			var node = $(e.target),
				content = node.val();

			this.model.set('content', content);
			this.initTemplate();
			this.model.save();
			this.render();
		},

		/* satura rediģēšanu var atcelt ar Esc taustiņu */
		cancelEdit: function(e) {
			if (e.which == 27) {
				this.render();
			}
		},

	});

	Board.Notes = Marionette.CollectionView.extend({
		el: 'div#board',
		className: 'note-wrapper',
		childView: Board.NoteView,

		bind: this,

		events: {
			"drop": "dropHandler"
		},

		initialize: function () {
			this.$el.droppable({
				treshold: 'pointer'
			});
		},

		dropHandler: function (e, ui) {
			var offset = this.el.offsetLeft;

			if (ui.draggable.hasClass('note-create')) {

				if (ui.helper.offset().left < offset) {
					return false;
				}
				var note = {
					posx: ui.helper.offset().left - offset,
					posy: ui.helper.offset().top,
					type: ui.draggable.data('type')
				};

				this.trigger("note:create", note);
			}
		}
	});
});