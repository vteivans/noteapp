NoteBoard.module("Board", function (Board, NoteBoard, Backbone, Marionette, $, _) {
	Board.Controller = {
		displayNotes: function (desktop) {
			var notes = NoteBoard.request("note:entities", function () {
				var notesView = new Board.Notes({
					collection: notes
				});

				// notesView.on("childview:notes:show", function (childView, model) {
				// 	NoteBoard.BoardApp.Show.Controller.showContact(model);
				// });


				// Catch delete event to remove item from model (liset_view.js)
				// Event can be captured here because it bubbles thoru to parents appending child names
				notesView.on ("childview:note:remove", function (childView, model) {

					if (model.get('content')) {

						if (confirm('Delete the note?')) {
							model.destroy();
						}
					} else {
						model.destroy();
					}
				});

				notesView.on ("note:create", function (note) {

					if (note && note['type']) {
						note['content'] = '';

						model = new NoteBoard.Entities.Note(note);
						notes.add(model);
						model.save();
					}
				});


				NoteBoard.boardRegion.show(notesView);
			}, desktop);
		}
	};
});