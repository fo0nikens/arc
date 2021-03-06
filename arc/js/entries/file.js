/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
$.getScript("/js/libs/jquery/filesaver.min.js");

const ENTRY_TYPE_FILE = 4;

var g_FilesMap = {};

function FilesAdd(id, reader, file) {
    console.log( "+ FILES[" + id + "] = '" + file.name + "', " + file.type + ", " + file.size + " b" );
    g_FilesMap[id] = {
        name: file.name,
        type: file.type,
        size: file.size,
        updated_at: file.lastModified,
        data: reader.result 
    };

    var $preview = $('#preview_' + id);
    if( file.type.indexOf("image/") == 0 ) {
        if( $preview ) {
            $preview.attr( 'src', "data:text/plain;base64," + btoa(g_FilesMap[id].data) ).show();
        }
    } else {
        $preview.hide();
    }
}

function FilesGet(id) {
    console.log( "< FILES[" + id + "]" );
    return g_FilesMap[id];
}

function FilesDel(id) {
    console.log( "- FILES[" + id + "]" );
    delete g_FilesMap[id];
}

function FileEntry(name, value) {
    Entry.call( this, ENTRY_TYPE_FILE, name, value );
}

FileEntry.prototype = Object.create(Entry.prototype);
FileEntry.prototype.constructor = FileEntry;

FileEntry.prototype.TypeName = function() {
    return "FileEntry";
}

FileEntry.prototype.Icon = function() {
    return 'cloud-upload';
}

FileEntry.prototype.formGroup = function(input, id, mime) {
    var id = this.id(id);

    if( mime && mime.indexOf("image/") == 0 ) {
        var file = FilesGet(id);

        html = '<div class="media">' +
                  '<img id="preview_' + id + '" onclick="javascript:downloadFor(\'' + id + '\')" class="preview-image mr-3" src="data:text/plain;base64,' + btoa(file.data) + '"/>' +
                  '<div class="media-body">' +
                    '<h5 class="editable entry-title mt-0" id="editable_' + id + '">' + this.name + '</h5>' +
                    input + 
                    '<label class="upload btn btn-default" for="' + id + '"><i class="fa fa-upload" aria-hidden="true"></i></label>' +
                  '</div>' +
               '</div>';
    }
    else {
        html = '<div class="form-group">' + 
                 '<span class="editable label entry-title label-default label-' + this.type + '" id="editable_' + id + '">' + this.name + ' </span>' + 
                    '<label class="upload btn btn-default" for="' + id + '"><i class="fa fa-upload" aria-hidden="true"></i>' +
                    input +
                 '</label>' +
                '</div>';
    }

    return html;
}

FileEntry.prototype.Render = function(idx, mime){
     return this.formGroup( this.input('file', false, idx), idx, mime); 
}

FileEntry.prototype.RenderToList = function(list, idx, dontclick) {
    var entry_id = this.id(idx);
    var rendered = '<div class="entry-edit">';
    
    if( this.is_new == false ) {
        var file = JSON.parse(this.value)

        g_FilesMap[entry_id] = file;

        if( file.type.indexOf("image/") != 0 ) {
            var type = "";
            if( file.type ) {
                type = file.type + ' / ';
            }
            rendered += '<small class="text-muted">' + type + bytesFormat( file.size ) + '</small> '; 
            rendered += '<a href="javascript:downloadFor(\''+entry_id+'\')"><i class="fa fa-download" aria-hidden="true"></i></a> '; 
        } else {
            rendered += '<small class="text-muted">' + bytesFormat( file.size ) + '</small> '; 
        }
    }
 
    rendered +=   '<a href="javascript:removeEntry('+idx+')"><i class="fa fa-trash" aria-hidden="true"></i></a>' +
                  '<a href="#" onclick="return false"><i class="fa fa-arrows" aria-hidden="true"></i></a>' +
                '</div>' +
                this.Render(idx, this.is_new ? null : g_FilesMap[entry_id].type);

    list.append( '<li class="secret-entry-item" id="secret_entry_' + idx + '">' + rendered + '</li>' );

    this.OnRendered(idx, dontclick);
}

FileEntry.prototype.OnRendered = function(id, dontclick) {
    Entry.prototype.OnRendered.call( this, id );

    var file_entry = this;
    var elem_id = this.id(id);
    var fileInput = document.getElementById(elem_id);
    var list = $('#secret_entry_list'); 

    var readFile = function () {
        // create new elements for multiple files.
        if( fileInput.files.length > 1 ) {
            for( var i = 1; i < fileInput.files.length; i++ ) {
                // snapshot scope
                var cb = function() {
                    var new_idx = list.find('li').length;
                    var new_file = fileInput.files[i];
                    var new_entry = new FileEntry( new_file.name, new_file );
                    new_entry.RenderToList( list, new_idx, true );

                    var new_reader = new FileReader();
                    new_reader.onload = function (e) {
                        FilesAdd( new_entry.id(new_idx), new_reader, new_file);
                    };

                    new_reader.readAsBinaryString(new_file);
                };
                cb();
            }
        } 
        
        var cb = function() {
            var first_file = fileInput.files[0];
            var first_reader = new FileReader();
            first_reader.onload = function (e) {
                FilesAdd(elem_id, first_reader, first_file);
            };
            $('#editable_' + elem_id ).text( first_file.name );
            first_reader.readAsBinaryString(first_file);
        };
        cb();
    };

    fileInput.addEventListener('change', readFile);

    if( this.is_new && !dontclick ) {
        fileInput.click();
    }
}
