/**
 * DisplayAnything - javascript behavours for image uploader
 * @copyright Codem 2011
 * @author James Ellis
 * @note issues to http://github.com/codem/DisplayAnything3/issues please
 * @see license.txt
 * @todo handle edit links using loadPanel to load up the editing form for a single File in context
 * @todo .on events are not being kept after reload event is triggered
 */
var DisplayAnything = function() {};
DisplayAnything.prototype = {
	uploader : null,
	uploads : 0,
	debug : false,
	init: function() {},
	queue : function(id, upload_config) {
		var _self = this;
		upload_config.element = jQuery('#' + id)[0];
		upload_config.debug = this.debug;
		if(typeof upload_config.maxConnections == 'undefined') {
			upload_config.maxConnections = 3;
		}
		upload_config.onSubmit = function(id, fileName) {
			jQuery(this.element).find('.qq-upload-list').show();
			_self.uploads++;
		};
		upload_config.onComplete = function(id, fileName, responseJSON) {
			_self.uploads--;
			_self.check_completion(this);
		};
		
		if(typeof upload_config.allowedExtensions == 'object') {
			var ext = upload_config.allowedExtensions;
			upload_config.allowedExtensions = [];
			var e;
			for(e in ext) {
				upload_config.allowedExtensions.push(ext[e]);
			}
		}
		
		this.uploader = new qq.FileUploader(upload_config);
		
		this.viewer();
	},
	check_completion : function(FileUploader) {
		if(!this.in_progress()) {
			this.reload_list(FileUploader.element);
		}
	},
	reload_list : function(elem) {
		jQuery(elem).parents('.file-uploader:first').find('a.reload').trigger('click');
	},
	in_progress : function() {
		return this.uploads > 0;
	},
	queue_init : function() {
		//on load, queue everything matching up
		this.queue_all();
		var _self = this;
		jQuery(document).on(                                                                                                                         
			'aftersubmitform',                                                                                                                  
			'#Form_EditForm',
			function(e, data) {
				//reload all aftersubmit is submitted successfully
				_self.queue_all();
			}
		);
	},
	queue_all : function() {
		var _self = this;
		jQuery('.uploader-upload-box').each(
			function() {
				try {
					//upload config comes in from rel attribute
					var config = jQuery.parseJSON(jQuery(this).attr('rel'));
					_self.queue(jQuery(this).attr('id'), config);
				} catch(e) {
					jQuery(this).html('Could not configure the uploader.');
				}
			}
		);
	},
	//handles behaviour on the viewer
	viewer : function() {
		var _self = this;
		
		//drag and drop sorting of items
		jQuery('.file-uploader-list')
			.sortable({
				stop : function() {
					var items=[];
					jQuery(this).children('.file-uploader-item').each(
						function(k,v) {
							items[k] = {
								id : jQuery(this).attr('rel'),
								pos : k,	
							}
						}
					);
					
					var list = this;
					jQuery.post(
						jQuery(list).parents('.file-uploader').find('a.sortlink').attr('href'),
						{ items : items },
						function() {
							_self.reload_list(list);
						}
					);
				}
			}).disableSelection();
		
		//reload items
		jQuery(document).on(
				'click',
				'.file-uploader a.reload',
				function(event) {
					event.preventDefault();
					jQuery('.qq-upload-drop-area').hide(100);
					jQuery(this)
						.addClass('loading')
						.parents('.file-uploader')
						.find('.file-uploader-list')
						.fadeTo(200,0.2)
						.load(
							jQuery(this).attr('href'),
							{},
							function() {
								//rebind all events to elements
								//_self.viewer();
								jQuery(this).fadeTo(200,1);
								jQuery('.file-uploader a.reload').removeClass('loading');
							}
						);
					return false;//avoid bubbling
				}
			);
		
		//reload all items beyond just the list of images
		jQuery(document).on(
				'click',
				'.file-uploader a.reload-all',
				function(event) {
					event.preventDefault();
					if(!_self.in_progress()) {
						jQuery(this).parents('.file-uploader').find('.qq-upload-list').hide().empty();
					}
				}
		);
		
		//delete items
		jQuery(document).on(
				'click',
				'.file-uploader-list .file-uploader-item a.deletelink',
				function(event) {
					event.preventDefault();
					try {
						var _elem = this;
						jQuery.post(
							jQuery(this).attr('href'),
							{},
							function() {
								_self.reload_list(_elem);
							}
						);
					} catch(e) {}
					return false;
				}
			);
		
		
		//edit items - bind some events to whereever the link loads
		jQuery(document).on(
				'click',
				'.file-uploader-list .file-uploader-item a.editlink',
				function(event) {
					event.preventDefault();
					var _elem = this;
					//create a dialog (refer LeftAndMain.js)
					var id = 'ss-ui-dialog-' + jQuery(this).parents('.file-uploader-item').attr('rel');
					var dialog = jQuery('#' + id);
					if(!dialog.length) {
						dialog = jQuery('<div class="ss-ui-dialog da-ss-ui-dialog" id="' + id + '" />');
						jQuery('body').append(dialog);
					}
					var extraClass = jQuery(this).data('popupclass');
					dialog.ssdialog({
						iframeUrl: jQuery(this).attr('href'),
						autoOpen: false,
						dialogExtraClass: extraClass,
						close : function() { _self.reload_list(_elem); }
					});
					//open it
					dialog.ssdialog('open');
					return false;
				}
			);
			
		//edit gallery usage
		jQuery('.display_anything_usage').find('select.usage_picker').change(
			function() {
				var p = jQuery(this).parents('.display_anything_usage');
				var o = jQuery(this).children('option:selected');
				var t = o.text();
				var title = '';
				var id = '';
				var mimetypes = '';
				if(jQuery(this).val() != '') {
					var patt = /(.*)\s{1}\((.*)\)/;
					var matches = t.match(patt);
					if(typeof matches[1] != 'undefined') {
						title = matches[1];
					}
					if(typeof matches[2] != 'undefined') {
						mimetypes = matches[2];
					}
					id = o.attr('value');
				}
				p.find('input.usage_id').val(id);
				p.find('input.usage_title').val(title);
				p.find('textarea.usage_mimetypes').val(mimetypes);
			}
		);
	}
};

jQuery(document).ready(
	function() {
		var u = new DisplayAnything();
		u.init();
		u.queue_init();
	}
);