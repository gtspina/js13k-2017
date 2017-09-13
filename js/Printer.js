var Printer = {};

Printer.drawRect = function (context, x, y, w, h, color, alpha) {
    context.fillStyle = color;

    if (alpha) {
        context.globalAlpha = alpha;
    }

    context.fillRect(x, y, w, h);
    context.globalAlpha = 1;
};

Printer.drawBorderRect = function (context, x, y, w, h, color, size) {
    var size = size ? size : "0.5"
    
    context.strokeStyle = color;
    context.lineWidth = size;
    context.strokeRect(x, y, w, h);
};

Printer.drawText = function (context, text, x, y, font, color) {
    context.fillStyle = color;
    context.font = font;
    context.fillText(text, x, y);
};