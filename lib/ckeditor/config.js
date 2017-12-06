/* global CKEDITOR */

CKEDITOR.editorConfig = function(config) {
    // Define changes to default configuration here.
    // For complete reference see:
    // http://docs.ckeditor.com/#!/api/CKEDITOR.config

    // 工具条配置 http://ckeditor.com/apps/ckeditor/4.4.0/samples/plugins/toolbar/toolbar.html

    config.toolbarGroups = [{name: "editing", groups: ["find", "selection", "editing"]},
        {name: "forms", groups: ["forms"]},
        {name: "basicstyles", groups: ["cleanup", "basicstyles"]},
        {name: "paragraph", groups: ["list", "indent", "blocks", "align", "bidi", "paragraph"]},
        {name: "document", groups: ["mode", "document", "doctools"]},
        {name: "others", groups: ["others"]},
        {name: "styles", groups: ["styles"]},
        {name: "colors", groups: ["colors"]},
        {name: "insert", groups: ["insert"]},
        {name: "links", groups: ["links"]},
        {name: "clipboard", groups: ["undo"]},
        {name: "tools", groups: ["tools"]},
        {name: "about", groups: ["about"]}]

    config.removeButtons = "Underline,Subscript,Superscript,Link,Unlink,Anchor,Outdent,Indent,Font,Cut,Copy,Paste,PasteText,PasteFromWord,About,Blockquote,HorizontalRule,SpecialChar"

    // Set the most common block elements.
    config.format_tags = "p;h1;h2;h3;pre"

    // Simplify the dialog windows.
    config.removeDialogTabs = "image:advanced;link:advanced"

    //
    config.removePlugins = "elementspath"

    config.height = "5em"

    // https://docs.ckeditor.com/#!/guide/dev_file_upload
    config.uploadUrl = "/api/school/ckeditor-image"
    config.filebrowserUploadUrl = "/api/school/ckeditor-file"

    config.bodyClass = "school-ck-editor"
}
