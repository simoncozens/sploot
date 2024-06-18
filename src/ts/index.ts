import * as Bootstrap from 'bootstrap'
import $ from "jquery";
import hbjs from "./hbjs";
import {Font } from "./font";
import { fontlist} from "./fontlist";
import "./colortoggle";
import "./sidebar";

window["$"] = $;

fetch(`assets/harfbuzz.wasm`)
  .then((response) => response.arrayBuffer())
  .then((bytes) => WebAssembly.instantiate(bytes))
  .then((results) => {
    // @ts-ignore
    const hb = hbjs(results.instance); // Dirty but works
    window["harfbuzz"] = results.instance;
    window["hbjs"] = hb;
  });


var handler = $('.handler');
var isHandlerDragging = false;

handler.on('mousedown', function(e) {
  isHandlerDragging = true;
});

handler.on('mouseup', function(e) {
  isHandlerDragging = false;
})

handler.on('mousemove', function(e) {
  if (!isHandlerDragging) {
    return false;
  }
  let boxBefore = $(this).prev();
  var containerOffsetLeft = boxBefore[0].offsetLeft;
  var pointerRelativeXpos = e.clientX - containerOffsetLeft;
  var boxAminWidth = 60;

  boxBefore[0].style.width = (Math.max(boxAminWidth, pointerRelativeXpos - 8)) + 'px';
  boxBefore[0].style.flexGrow = "0";
});

$("#charlist-toggle-item").on("click", function() {
  let state = $("#charlist").css("display") == "none";
  $("#charlist").toggle();
  $("#charlist-handle").toggle();
  $("#charlist-toggle-item").html(
    state ? "Hide Character List" : "Show Character List"
  );
});
$("#glyphlist-toggle-item").on("click", function() {
  let state = $("#glyphlist").css("display") == "none";
  $("#glyphlist").toggle();
  $("#glyphlist-handle").toggle();
  $("#glyphlist-toggle-item").html(
    state ? "Hide Glyph List" : "Show Glyph List"
  );
});

// Update text on change

$("#text").on("input", fontlist.updateText.bind(fontlist));

function handleUpload(files: FileList) {
  for (var file of files) {
    // Is it a TTF/OTF?
    if (file.type == "font/ttf" || file.type == "font/otf") {
      var reader = new FileReader();
      reader.onload = (function (file: File) {
        return (e) => {
          var arrayBuffer = reader.result as ArrayBuffer;
          var byteArray = new Uint8Array(arrayBuffer);
          try {
            var newFont = new Font(file.name, byteArray);
            console.log("Adding new font "+file.name);
            fontlist.addFont(newFont);
          }
          catch (e) {
            console.error(e);
            $("#toast .toast-body").html("Error loading font: " + e);
            (new Bootstrap.Toast($("#toast")[0])).show();
          }
        };
      })(file);
      reader.readAsArrayBuffer(file);
    } else {
      $("#toast .toast-body").html("Invalid file type: " + file.type);
      (new Bootstrap.Toast($("#toast")[0])).show();
    }
  }
}

// Drop zone handling
$("#main").on("dragover", function(e) { e.preventDefault(); });
$("#main").on("dragenter", function(e) { e.preventDefault(); });
$("#main").on("drop", function(e) {
  console.log("Drop on main")
  e.preventDefault();
  e.stopPropagation();
  handleUpload(e.originalEvent.dataTransfer.files);
});
