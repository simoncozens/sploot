import * as Bootstrap from "bootstrap";
import $ from "jquery";
import hbjs from "./hbjs";
import { Font } from "./font";
import { fontlist } from "./fontlist";
import "./colortoggle";
import "./sidebar";

window["$"] = $;

$(() => {
  $('[data-toggle="tooltip"]').each((i, el) => {
    new Bootstrap.Tooltip(el);
  });
  // Disable live reload if there's no FileSystem API
  if (!("showOpenFilePicker" in window)) {
    $("#live-reload svg use").attr("href", "#lightning-charge");
    $("#live-reload").parent().hide();
  } else {
    $("#live-reload").on("click", () => {
      if (liveReloading()) {
        $("#live-reload svg use").attr("href", "#lightning-charge");
      } else {
        $("#live-reload svg use").attr("href", "#lightning-charge-fill");
      }
    });
  }

  // Focus on input when browser tab is focused
  document.addEventListener("visibilitychange", () => {
    $("#text").trigger("focus");
  });
  $(window).on("focus", () => {
    $("#text").trigger("focus");
  });

});

function liveReloading() {
  return $("#live-reload svg use").attr("href") == "#lightning-charge-fill";
}

fetch(`assets/harfbuzz.wasm`)
  .then((response) => response.arrayBuffer())
  .then((bytes) => WebAssembly.instantiate(bytes))
  .then((results) => {
    // @ts-ignore
    const hb = hbjs(results.instance); // Dirty but works
    window["harfbuzz"] = results.instance;
    window["hbjs"] = hb;
  });

var handler = $(".handler");
var isHandlerDragging = false;

handler.on("mousedown", function (e) {
  isHandlerDragging = true;
});

handler.on("mouseup", function (e) {
  isHandlerDragging = false;
});

handler.on("mousemove", function (e) {
  if (!isHandlerDragging) {
    return false;
  }
  let boxBefore = $(this).prev();
  var containerOffsetLeft = boxBefore[0].offsetLeft;
  var pointerRelativeXpos = e.clientX - containerOffsetLeft;
  var boxAminWidth = 60;

  boxBefore[0].style.width =
    Math.max(boxAminWidth, pointerRelativeXpos - 8) + "px";
  boxBefore[0].style.flexGrow = "0";
});

$("#charlist-toggle-item").on("click", function () {
  let state = $("#charlist").css("display") == "none";
  $("#charlist").toggle();
  $("#charlist-handle").toggle();
  $("#charlist-toggle-item").html(
    state ? "Hide Character List" : "Show Character List"
  );
});
$("#glyphlist-toggle-item").on("click", function () {
  let state = $("#glyphlist").css("display") == "none";
  $("#glyphlist").toggle();
  $("#glyphlist-handle").toggle();
  $("#glyphlist-toggle-item").html(
    state ? "Hide Glyph List" : "Show Glyph List"
  );
});

// Update text on change

$("#text").on("input", fontlist.updateText.bind(fontlist));

async function standardLoad(item: DataTransferItem) {
  // Safari
  var reader = new FileReader();
  reader.onload = (function (file: File) {
    return (e) => {
      var arrayBuffer = reader.result as ArrayBuffer;
      var byteArray = new Uint8Array(arrayBuffer);
      var newFont = new Font(undefined);
      fontlist.fonts.push(newFont);
      newFont.familyname = "font" + fontlist.fonts.length;
      newFont.init(byteArray);
      newFont.filename = file.name;
      fontlist.update();
    };
  })(item.getAsFile());
  reader.readAsArrayBuffer(item.getAsFile());
}

async function liveReload(item: DataTransferItem) {
  // Chrome and friends
  let handle: FileSystemHandle = await item.getAsFileSystemHandle();
  let font = new Font(handle as FileSystemFileHandle);
  setInterval(font.compare.bind(font), 1000);
}

async function handleUpload(files: DataTransferItemList) {
  for (var item of files) {
    // Is it a TTF/OTF?
    if (
      item.kind == "file" &&
      (item.getAsFile().type == "font/ttf" ||
        item.getAsFile().type == "font/otf" ||
        !item.getAsFile().type)
    ) {
      console.log("Live reloading?", liveReloading());
      if (liveReloading()) {
        try {
          liveReload(item);
        } catch (e) {
          standardLoad(item);
        }
      } else {
        standardLoad(item);
      }
    } else {
      $("#toast .toast-body").html(
        "Invalid file type: " + item.getAsFile().type
      );
      new Bootstrap.Toast($("#toast")[0]).show();
    }
  }
}

// Drop zone handling
$("#main").on("dragover", function (e) {
  e.preventDefault();
});
$("#main").on("dragenter", function (e) {
  e.preventDefault();
});
$("#main").on("drop", function (e) {
  console.log("Drop on main");
  e.preventDefault();
  e.stopPropagation();
  handleUpload(e.originalEvent.dataTransfer.items);
});
