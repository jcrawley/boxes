var Boxes = {
    /**
     * Constant for the left mouse button.
     */
    LEFT_BUTTON: 1,

    /**
     * Sets up the given jQuery collection as the drawing area(s).
     */
    setDrawingArea: function (jQueryElements) {
        jQueryElements
            .addClass("drawing-area")
            // "this" is Boxes.
            .mousedown(this.startDraw)
            .mousemove(this.trackDrag)

            // We conclude drawing on either a mouseup or a mouseleave.
            .mouseup(this.endDrag)
            .mouseleave(this.endDrag);
    },

    /**
     * Utility function for disabling certain behaviors when the drawing
     * area is in certain states.
     */
    setupDragState: function () {
        $(".drawing-area .box")
            .unbind("mousemove")
            .unbind("mouseleave");
    },

    /**
     * Begins a box draw sequence.
     */
    startDraw: function (event) {
        // We only respond to the left mouse button.
        if (event.which === Boxes.LEFT_BUTTON) {
            // Add a new box to the drawing area.  Note how we use
            // the drawing area as a holder of "local" variables
            // ("this" as standardized by jQuery).
            this.anchorX = event.pageX;
            this.anchorY = event.pageY;
            this.drawingBox = $("<div></div>")
                .appendTo(this)
                .addClass("box")
                .offset({ left: this.anchorX, top: this.anchorY });

            // Take away the highlight behavior while the draw is
            // happening.
            Boxes.setupDragState();
            $("<div></div>").appendTo(this.drawingBox)
            .addClass("bottomR")
            .mousedown(this.resize);
            $("<div></div>").appendTo(this.drawingBox).addClass("bottomL");
            $("<div></div>").appendTo(this.drawingBox).addClass("upperR");
            $("<div></div>").appendTo(this.drawingBox).addClass("upperL");
        }

    },

    /**
     * Tracks a box as it is rubberbanded or moved across the drawing area.
     */
    trackDrag: function (event) {
        // Don't bother if we aren't tracking anything.
        if (this.drawingBox) {
            // Calculate the new box location and dimensions.  Note how
            // this might require a "corner switch."
            var newOffset = {
                left: (this.anchorX < event.pageX) ? this.anchorX : event.pageX,
                top: (this.anchorY < event.pageY) ? this.anchorY : event.pageY
            };

            this.drawingBox
                .offset(newOffset)
                .width(Math.abs(event.pageX - this.anchorX))
                .height(Math.abs(event.pageY - this.anchorY));
            this.anchorX = (this.anchorX < event.pageX) ? this.anchorX : event.pageX;
            
        } else if (this.resizingBox) {
            // Resizing the object.
             var newOffset = {
                left: (this.anchorX < event.pageX) ? this.anchorX : event.pageX,
                top: (this.anchorY < event.pageY) ? this.anchorY : event.pageY
            };
            this.resizingBox.offset({
                left: event.pageX - parent.deltaX,
                top: event.pageY - parent.deltaY
            })
                .offset(newOffset)
                .width(Math.abs(event.pageX - this.anchorX))
                .height(Math.abs(event.pageY - this.anchorY)); ;
            this.resizingBox.width(Math.abs(event.pageX - this.anchorX))
                .height(Math.abs(event.pageY - this.anchorY));
            
        } else if (this.movingBox) {
            // Reposition the object.

                this.movingBox.offset({
                    left: event.pageX - this.deltaX,
                    top: event.pageY - this.deltaY
            });

        if((((event.pageX - this.deltaX) > $("#drawing-area").width() ||
            (event.pageY - this.deltaY) > $("#drawing-area").height())) && !printed){
                $(this.movingBox).css({"cursor" :"url(icon_delete_small.png), auto"});
                this.movingBox.text("Release to delete");
                
        } else if(((event.pageX - this.deltaX) < $("#drawing-area").width() ||
                (event.pageY - this.deltaY) < $("#drawing-area").height())){
                    $(this.movingBox).css({"cursor" : "move"});
                    this.movingBox.text("");
                    	printed = false;
            } 
        }
    },

    /**
     * Concludes a drawing or moving sequence.
     */
    endDrag: function (event) {
        if (this.drawingBox) {
            // Finalize things by setting the box's behavior.
            this.drawingBox
                .mousemove(Boxes.highlight)
                .mouseleave(Boxes.unhighlight)
                .mousedown(Boxes.startMove);


            // All done.
            this.drawingBox = null;
        } else if (this.resizingBox) {
            // Change state to "not-moving-anything" by clearing out
            // this.movingBox.
            if(this.anchorX > event.pageX){
            	this.anchorX = event.pageX;
            }
            if(this.anchorY > event.pageY){
            	this.anchorY = event.pageY;
            }
            this.resizingBox = null;
            this.movingBox = null;

        } else if (this.movingBox) {
            // Change state to "not-moving-anything" by clearing out
            // this.movingBox.
            this.anchorX += this.beginX;
            this.anchorY += this.beginY;
             if(((event.pageX - this.deltaX) > $("#drawing-area").width() ||
             (event.pageY - this.deltaY) > $("#drawing-area").height())){
                $(this.movingBox).remove();
                event.stopPropagation();
                this.movingBox = null;

            }
            this.movingBox = null;

        }

        // In either case, restore the highlight behavior that was
        // temporarily removed while the drag was happening.
        $(".drawing-area .box")
            .removeClass("box-highlight")
            .mousemove(Boxes.highlight)
            .mouseleave(Boxes.unhighlight);
    },

    /**
     * Indicates that an element is highlighted.
     */
    highlight: function () {
        $(this).addClass("box-highlight");
        $(this).find(".bottomR").addClass("bottomR-highlight");
        $(this).find(".bottomL").addClass("bottomL-highlight");
        $(this).find(".upperL").addClass("upperL-highlight");
        $(this).find(".upperR").addClass("upperR-highlight");

    },

    /**
     * Indicates that an element is unhighlighted.
     */
    unhighlight: function () {
        $(this).removeClass("box-highlight");
        $(this).find(".bottomR").removeClass("bottomR-highlight");
        $(this).find(".bottomL").removeClass("bottomL-highlight");
        $(this).find(".upperL").removeClass("upperL-highlight");
        $(this).find(".upperR").removeClass("upperR-highlight");

    },

    /**
     * Begins a box move sequence.
     */
    startMove: function (event) {
        // We only move using the left mouse button.
        if (event.which === Boxes.LEFT_BUTTON) {
            // Take note of the box's current (global) location.
            var jThis = $(this),//jThis is the current box
                startOffset = jThis.offset(),
                // Grab the drawing area (this element's parent).
                // We want the actual element, and not the jQuery wrapper
                // that usually comes with it.
                parent = jThis.parent().get(0);//pic 1

            // Set the drawing area's state to indicate that it is
            // in the middle of a move.
            parent.Box = jThis;

            if(Math.abs(event.pageX - (jThis.position().left + $(this).width())) < 20 && 
            Math.abs(event.pageY - (jThis.position().top + $(this).height())) < 20){
                parent.resizingBox = jThis;
            }
            else{
            parent.movingBox = jThis;//get coordinates within drawing area
            }
            parent.deltaX = event.pageX - startOffset.left;
            parent.deltaY = event.pageY - startOffset.top;

            Boxes.setupDragState();

            // Take away the highlight behavior while the move is
            // happening.
            Boxes.setupDragState();

            // Eat up the event so that the drawing area does not
            // deal with it.
            event.stopPropagation();//pic 2 prevent the mousedown to cascade to drawing area and so on ...
            this.beginX = event.pageX;
            this.beginY = event.pageY;
        }
    },
    resize: function (event){
        width = Math.abs(event.pageX - this.anchorX);
        height = Math.abs(event.pageY - this.anchorY);
    }

};