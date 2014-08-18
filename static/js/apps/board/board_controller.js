NoteBoard.module("Board", function (Board, NoteBoard, Backbone, Marionette, $, _) {
	Board.Controller = {
		displayNotes: function (desktop) {
			var notes = NoteBoard.request("note:entities", function () {
				var notesView = new Board.Notes({
					collection: notes
				});


				// Catch delete event to remove item from model (board_view.js)
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


				notesView.on ("note:create", Board.Controller.createNote);

				NoteBoard.boardRegion.show(notesView);
			}, desktop);
		},

		createNote: function (note) {
			notes = NoteBoard.request("note:entities");

			if (note && note['type']) {
				note['content'] = '';

				model = new NoteBoard.Entities.Note(note);
				notes.add(model);
				model.save();
			}
		}
	};
});