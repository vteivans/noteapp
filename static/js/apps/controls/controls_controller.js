NoteBoard.module("Controls", function (Controls, NoteBoard, Backbone, Marionette, $, _) {
	Controls.Controller = {
		displayControls: function () {
			var controls = new Backbone.Collection([
				{type: 'txt', text: 'Txt'},
				{type: 'img', text: 'Img'}
			]);

			var controlsView = new Controls.Group({
				collection: controls
			});

			NoteBoard.sidebarTop.show(controlsView);
		}
	}
});