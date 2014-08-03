NoteBoard.module("Entities", function (Entities, NoteBoard, Backbone, Marionette, $, _) {
	
	Entities.Note = Backbone.Model.extend();

	Entities.NoteCollection = Backbone.Collection.extend({
		model: Entities.Note,
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

	var notes;

	var initializeNotes = function (initiaizedCallback) {

		notes = new Entities.NoteCollection();
		
		notes.fetch({
			success: function (data) {
				if (typeof initiaizedCallback == 'function') {
					initiaizedCallback(data);
				}
			}
		});
	};

	var API = {
		getNoteEntities: function (initiaizedCallback) {
			if (notes === undefined) {
				initializeNotes(initiaizedCallback);
			}
			return notes;
		}
	};

	NoteBoard.reqres.setHandler("note:entities", function (initiaizedCallback) {
		return API.getNoteEntities(initiaizedCallback);
	});
});