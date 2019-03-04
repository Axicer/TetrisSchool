class Tetrominos{

    constructor(voxel){
        this.voxel = voxel;
        //the next tetrominos wich will spawn
        this.next = TETROMINOSES.poses[parseInt(Math.random()*TETROMINOSES.poses.length)];
        //the swap tetrominos (null at initialisation)
        this.swap = null;
        //set matrix, tile, and position from this.next
        this.reset();
        //start gravity
        this.setGravityInterval(1000);
    }

    setGravityInterval(millis){
        //set the timeout
        this.gravityTimeout = millis
        //if the timeout is already running, clear the interval
        if(this.gravityInterval != null)clearInterval(this.gravityInterval);
        //set the interval
        this.gravityInterval = setInterval((function(self){
            return function(){
                //apply gravity
                self.gravity();
                //check for fix later
                self.checkTimeout = setTimeout((function(self){
                    return function(){
                        self.checkFix();
                    }
                })(self), 900);
            }
        })(this), this.gravityTimeout);
    }

    swapTetrominos(){
        //if swap has already occurs then return
        if(this.hasSwapped)return;
        if(this.swap == null){
            //swap slot is empty
            //set swap to current tetrominos
            this.swap = {matrix:this.matrix, tile:this.tile};
            //spawn the next tetrominos
            this.reset();
        }else{
            //swap the current tetrominos and the swap slot
            var tmp = this.swap;
            this.swap = {matrix:this.matrix, tile:this.tile};
            this.matrix = tmp.matrix;
            this.tile = tmp.tile;
            //reset the location
            this.location = [parseInt(this.voxel.width/2)-2, 0];
        }
        this.hasSwapped = true;
        this.draw();
    }

    reset(){
        this.matrix = this.next.matrix;
        this.tile = this.next.tile;
        this.next = TETROMINOSES.poses[parseInt(Math.random()*TETROMINOSES.poses.length)];
        this.location = [parseInt(this.voxel.width/2)-2, 0];
    }

    gravity(){
        this.move(0, 1, false);
    }

    checkFix(){
        for(var y = 0 ; y < this.matrix.tab.length ; y++){
            for(var x = 0 ; x < this.matrix.tab[y].length ; x++){
                if(this.matrix.tab[y][x] == 1){
                    if(this.location[1]+y+1 >= this.voxel.height ||
                        this.voxel.get(this.location[0]+x, this.location[1]+y+1) != null){
                        //attach the tetrominos to the voxel
                        this.attach();
                        this.voxel.checkLines();
                        //reset tetrominos
                        this.hasSwapped = false;
                        this.reset();
                        this.draw();
                        break;
                    }
                }
            }
        }
    }

    /**
    *   draw the tetrominos at his actual place
    */
    draw(){
        //only draw if the tiles are loaded
        if(!areTilesLoaded())return;

        //clear the canvas
        var canvas = document.getElementById("tetris_falling");
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        //draw the piece
        for(var y = 0 ; y < this.matrix.tab.length ; y++){
            for(var x = 0 ; x < this.matrix.tab[y].length ; x++){
                if(this.matrix.tab[y][x] == 1){
                    var coordX = (this.location[0] + x) * TILE_SIZE;
                    var coordY = (this.location[1] + y) * TILE_SIZE;
                    ctx.drawImage(this.tile, coordX, coordY);
                }
            }
        }

        //get preview position
        var previewCoordX = this.location[0];
        var previewCoordY = this.location[1];
        var canFall = true;
        while(canFall){
            for(var y = 0 ; y < this.matrix.tab.length ; y++){
                for(var x = 0 ; x < this.matrix.tab[y].length ; x++){
                    if(this.matrix.tab[y][x] == 1){
                        var coordX = previewCoordX + x;
                        var coordY = previewCoordY + y + 1;
                        if(this.voxel.get(coordX, coordY) != null ||
                            !this.voxel.isInside(coordX, coordY)){
                            canFall = false;
                        }
                    }
                }
            }
            if(canFall)previewCoordY++;
        }


        //draw preview
        ctx.globalAlpha = 0.5;
        for(var y = 0 ; y < this.matrix.tab.length ; y++){
            for(var x = 0 ; x < this.matrix.tab[y].length ; x++){
                if(this.matrix.tab[y][x] == 1){
                    var coordX = (previewCoordX + x) * TILE_SIZE;
                    var coordY = (previewCoordY + y) * TILE_SIZE;
                    ctx.drawImage(this.tile, coordX, coordY);
                }
            }
        }
        ctx.globalAlpha = 1.0;

        //draw next preview
        var next_elem = document.getElementById("tetris_next_tetrominos");
        var next_ctx = next_elem.getContext("2d");
        next_ctx.clearRect(0, 0, next_elem.width, next_elem.height);
        for(var y = 0 ; y < this.next.matrix.tab.length ; y++){
            for(var x = 0 ; x < this.next.matrix.tab[y].length ; x++){
                if(this.next.matrix.tab[y][x] == 1){
                    var nextCoordX = (x+(4-this.next.matrix.tab.length)/2)*TILE_SIZE;
                    var nextCoordY = (y+(4-this.next.matrix.tab[y].length)/2)*TILE_SIZE;
                    next_ctx.drawImage(this.next.tile, nextCoordX, nextCoordY);
                }
            }
        }

        //draw stored preview
        if(this.swap != null){
            var stored_elem = document.getElementById("tetris_stored_tetrominos");
            var stored_ctx = stored_elem.getContext("2d");
            stored_ctx.clearRect(0, 0, stored_elem.width, stored_elem.height);
            for(var y = 0 ; y < this.swap.matrix.tab.length ; y++){
                for(var x = 0 ; x < this.swap.matrix.tab[y].length ; x++){
                    if(this.swap.matrix.tab[y][x] == 1){
                        var swapCoordX = (x+(4-this.swap.matrix.tab.length)/2)*TILE_SIZE;
                        var swapCoordY = (y+(4-this.swap.matrix.tab[y].length)/2)*TILE_SIZE;
                        stored_ctx.drawImage(this.swap.tile, swapCoordX, swapCoordY);
                    }
                }
            }
        }

    }

    attach(){
        PLACE_SOUND.play();
        for(var y = 0 ; y < this.matrix.tab.length ; y++){
            for(var x = 0 ; x < this.matrix.tab[y].length ; x++){
                if(this.matrix.tab[y][x] == 1){
                    var coordX = this.location[0] + x;
                    var coordY = this.location[1] + y;
                    //if there is already a piece
                    if(this.voxel.get(coordX, coordY) != null){
                        //stop the gravity & check loop
                        clearInterval(this.gravityInterval);
                        clearTimeout(this.checkTimeout);
                        //end the game
                        this.voxel.end();
                        return;
                    }else{
                        //put the piece
                        this.voxel.set(this.location[0]+x, this.location[1]+y, this.tile);
                    }
                }
            }
        }
    }

    rotateLeft(){
        var m = this.matrix.rotateCounterClockwise();
        for(var y = 0 ; y < m.tab.length ; y++){
            for(var x = 0 ; x < m.tab[y].length ; x++){
                if(m.tab[y][x] == 1){
                    var coordX = this.location[0] + x;
                    var coordY = this.location[1] + y;
                    if(!this.voxel.isInside(coordX, coordY) ||
                        this.voxel.get(coordX, coordY) != null){
                        return;
                    }
                }
            }
        }
        this.matrix = m;
        this.draw();
    }

    rotateRight(){
        var m = this.matrix.rotateClockwise();
        for(var y = 0 ; y < m.tab.length ; y++){
            for(var x = 0 ; x < m.tab[y].length ; x++){
                if(m.tab[y][x] == 1){
                    var coordX = this.location[0] + x;
                    var coordY = this.location[1] + y;
                    if(!this.voxel.isInside(coordX, coordY) ||
                        this.voxel.get(coordX, coordY) != null){
                        return;
                    }
                }
            }
        }
        this.matrix = m;
        this.draw();
    }

    move(dx = 0 , dy = 0, sound = true){
        for(var y = 0 ; y < this.matrix.tab.length ; y++){
            for(var x = 0 ; x < this.matrix.tab[y].length ; x++){
                if(this.matrix.tab[y][x] == 1){
                    var coordX = this.location[0] + x + dx;
                    var coordY = this.location[1] + y + dy;
                    if(this.voxel.get(coordX, coordY) != null ||
                        !this.voxel.isInside(coordX, coordY)){
                        return false;
                    }
                }
            }
        }
        if(sound)MOVEMENT_SOUND.play();
        this.location[0] += dx;
        this.location[1] += dy;
        this.draw();
        return true;
    }

    hardDrop(){
        HARD_DROP_SOUND.play();
        while(this.move(0, 1, false)){}
        this.checkFix();
    }
}
