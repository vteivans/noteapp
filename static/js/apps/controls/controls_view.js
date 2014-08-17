NoteBoard.module("Controls", function (Controls, NoteBoard, Backbone, Marionette, $, _) {
	
	Controls.Button = Marionette.ItemView.extend({
		tagName: 'a',
		className: 'note-create',

		template: _.template('<%= text %>'),

		events: {
			"click" : "clickHandler"
		},

		initialize: function () {
			var noteType = this.model.get('type');
			this.$el.addClass("note-" + noteType);
			this.el.setAttribute("data-type", noteType);

			this.$el.draggable({
				revert: true,
				helper: 'clone',
				appendTo: 'body',
				zIndex: 100
			});
		},

		clickHandler: function (e) {
			e.preventDefault();
			var button = $(e.target);
			
			if (button.hasClass("note-create")){
			
				var note = NoteBoard.Board.Controller.createNote({
					posx: 280,
					posy:40,
					type: this.$el.data('type')
				});
			}
		},
	});

	Controls.Group = Marionette.CollectionView.extend({
		tagName: "div",
		id: "controls",
		className: "controls",
		childView: Controls.Button
	});
})