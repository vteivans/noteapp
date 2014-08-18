NoteBoard.module("Entities", function (Entities, NoteBoard, Backbone, Marionette, $, _) {
	
	Entities.Note = Backbone.Model.extend();
	
	var desktop = 1;

	Entities.NoteCollection = Backbone.Collection.extend({
		model: Entities.Note,
		url: function () {
			// var desk = this.desk || document.location.pathname.match(/^\/[0-9]+/);
			
			// if (desk) {
			// 	desk = desk[0].replace(/\//, '');
			// } else {
			// 	desk = 1;
			// }
			return '/notes/desktop/' + desktop;
		},
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
		getNoteEntities: function (initiaizedCallback, desk) {


			if (desk) {
				desk = Number(desk);
			} else {
				return notes;
			}

			if (desk !== desktop || typeof notes != undefined) {
				desktop = desk;
				notes = undefined;
				initializeNotes(initiaizedCallback);
			}
			return notes;
		}
	};

	NoteBoard.reqres.setHandler("note:entities", function (initiaizedCallback, desk) {
		return API.getNoteEntities(initiaizedCallback, desk);
	});
});