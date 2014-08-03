NoteBoard.module("Entities", function (Entities, NoteBoard, Backbone, Marionette, $, _) {
	Entities.Desktop = Backbone.Model.extend();
	Entities.DesktopCollection = Backbone.Collection.extend({
		model: Entities.Desktop,
		url: '/desktops'
	});

	var desktops;

	var initializeDesktops = function (initiaizedCallback) {
		desktops = new Entities.DesktopCollection();
		desktops.fetch({
			success: function (data) {
				if (typeof initiaizedCallback == 'function') {
					initiaizedCallback(data);
				}
			}
		});
	};

	var API = {
		getDesktopEntities: function (initiaizedCallback) {
			if (desktops === undefined) {
				initializeDesktops(initiaizedCallback);
			}
			return desktops;
		}
	};

	NoteBoard.reqres.setHandler("desktop:entities", function (initiaizedCallback) {
		return API.getDesktopEntities(initiaizedCallback);
	});
});