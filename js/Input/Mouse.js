"use strict";

var Mouse = {
    pos: { x: 0, y: 0 },
    leftDown: false,
    leftClick: false,
    rightDown: false,
    rightClick: false,
    middleDown: false,
    middleClick: false,
};

Mouse.init = function (canvasName) {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleKeyUp);
    window.addEventListener("mousedown", handleKeyDown);

    var that = this;
    var canvas = document.getElementById(canvasName);

    function handleKeyUp(evt) {
        if (evt.which == 1) {
            that.leftDown = false;
        }

        if (evt.which == 2) {
            that.middleDown = false;
        }

        if (evt.which == 3) {
            that.rightDown = false;
        }
    }

    function handleKeyDown(evt) {
        if (evt.which == 1) {
            if (!that.leftDown) {
                that.leftClick = true;
            }

            that.leftDown = true;
        }

        if (evt.which == 2) {
            if (!that.middleDown) {
                that.middleClick = true;
            }

            that.middleDown = true;
        }

        if (evt.which == 3) {
            if (!that.rightDown) {
                that.rightClick = true;
            }

            that.rightDown = true;
        }
    }

    function handleMouseMove(evt) {
        var canvasPos = canvas.getBoundingClientRect();

        Mouse.pos =  { x: evt.pageX - canvasPos.left, y: evt.pageY - canvasPos.top };
        //console.log(Mouse.pos, canvasPos.left, canvasPos.top);
    }
};

Mouse.update = function () { };

Mouse.reset = function () {
    var that = this;

    that.leftClick = false;
    that.rightClick = false;
    that.middleClick = false;
};