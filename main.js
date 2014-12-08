/* Nine Dots Dungeon for Ludum Dare 31, Mihail Szabolcs, 2014 */
if(!window.requestAnimationFrame)
{
  window.requestAnimationFrame = (function()
  {
    return window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback, element) { window.setTimeout(callback, 1000 / 60);  };
  })();
}

function Rect()
{
  this.initialize.apply(this, arguments);
}
Rect.prototype = 
{
  initialize: function(x, y, w, h)
  {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
};

function Keyboard()
{
  this.initialize.apply(this, arguments);
}
Keyboard.Keys = 
{
  UP    : 38,
  DOWN  : 40,
  LEFT  : 37,
  RIGHT : 39,
  SPACE : 32
};
Keyboard.prototype = 
{
  initialize: function(element)
  {
    this.keys = {};

    var self = this;
    if(element.event)
    {
      element.onkeydown = function(e)
      {
        self.keys[e.which] = true;  
      };
      element.onkeyup = function(e)
      {
        self.keys[e.which] = false;  
      }
    }
    else
    {
      element.onkeydown = function(e)
      {
        self.keys[e.keyCode] = true;  
      };
      element.onkeyup = function(e)
      {
        self.keys[e.keyCode] = false;  
      }
    }
  },
  update: function(dt)
  {
    this.keys = {};  
  }
};

function Tile()
{
  this.initialize.apply(this, arguments);
}
Tile.GROUND = 0;
Tile.WALL = 1;
Tile.PLAYER = 13;
Tile.PLAYER_GROUND = 14;
Tile.ENEMY = 42;
Tile.ENEMY_GROUND = 43;
Tile.type_to_color = function(type)
{
  switch(type)
  {
    case Tile.GROUND:
      return "#333333";

    case Tile.WALL:
      return "#999999";

    case Tile.PLAYER:
      return "#ff0033";

    case Tile.PLAYER_GROUND:
      return "#b00011";

    case Tile.ENEMY:
      return "#fff033";

    case Tile.ENEMY_GROUND:
      return "#ff8011";
  }

  return "#ffffff";
};
Tile.prototype = 
{
  initialize: function(x, y, type)
  {
    this.x = x;
    this.y = y;
    this.score = 0;
    this.set(type);
  },
  set: function(type)
  {
    this.type = type;
    this.color = Tile.type_to_color(this.type);

    if(this.score < 9)
      this.score += 1;

    return this;
  }
};

function Map()
{
  this.initialize.apply(this, arguments);
}
Map.prototype = 
{
  initialize: function(bounds)
  {
    this.bounds = bounds;

    this.w = bounds.w >> 4;
    this.h = bounds.h >> 4;
    this.s = this.w * this.h;
    this.ts = 12;
    this.ground = 0;

    this.randomize();
  },
  setTile: function(x, y, type)
  {
    return this.tiles[x + (y * this.w)].set(type);
  },
  getTile: function(x, y)
  {
    return this.tiles[x + (y * this.w)];
  },
  draw: function(ctx)
  {
    for(var i=0; i<this.s; i++)
    {
      var tile = this.tiles[i];

      ctx.fillStyle = tile.color;
      ctx.fillRect(tile.x, tile.y, this.ts, this.ts);

      if(0)//tile.type == Tile.GROUND || tile.type == Tile.ENEMY_GROUND || tile.type == Tile.PLAYER_GROUND)
      {
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px bold Arial";
        ctx.fillText(tile.score.toString(), tile.x + 3, tile.y + 10);
      }
    }
  },
  randomize: function()
  {
    this.tiles = [];

    for(var i=0; i<this.s; i++)
      this.tiles.push(new Tile((i % this.w) << 4, (i / this.w) << 4, Tile.WALL));

    for(var i=0; i<this.s; i++)
    {
      var x = Math.random() * this.w | 0;
      var y = Math.random() * this.h | 0;

      var tile = this.tiles[x + y * this.w];
      if(tile.type == Tile.WALL)
        tile.set(Tile.GROUND);
      else
        this.ground++;

      if(Math.random() * 66 < 11)
        continue;

      var rx = Math.random() * 66;
      var ry = Math.random() * 66;

      var dx = (rx > 33 ?  1 : (rx > 11 ? -1 : 0));
      var dy = (ry > 33 ? -1 : (ry > 11 ?  1 : 0));

      if(x > 0 && x < this.w - 1)
        x += dx;

      if(y > 0 && y < this.h - 1)
        y += dy;

      tile = this.tiles[x + y * this.w];
      if(tile.type == Tile.WALL)
        tile.set(Tile.GROUND);
      else
        this.ground++;
    }

    // HUD
    for(var y=0; y<6; y++)
    {
      for(var x=0; x<16; x++)
      {
        var tile = this.tiles[x + y * this.w];
 
        if(tile.type == Tile.GROUND)
          this.ground--;

        if(x > 0 && y > 0 && x < 15 && y < 5)
          tile.set(Tile.GROUND);
        else
          tile.set(Tile.WALL);
      }
    }
  }
};

function Player(x, y)
{
  this.initialize.apply(this, arguments);
}
Player.prototype = 
{
  initialize: function(map)
  {
    this.map = map;

    while(1) // FIXME: this could cause an infinite loop :)
    {
      this.x = (Math.random() * this.map.w) | 0;
      this.y = (Math.random() * this.map.h) | 0;

      if(this.x < 6 || this.y < 16)
        continue;

      var tile = this.map.getTile(this.x, this.y);
      if(tile.type == Tile.GROUND)
      {
        this.map.setTile(this.x, this.y, Tile.PLAYER);
        this.map.ground--;
        break; 
      }
    }

    this.ground = 0;
  },
  update: function(dt, keyboard)
  {
    if(keyboard.keys[Keyboard.Keys.LEFT])
    {
      if(this.can_move_to(-1, 0))
      {
        this.map.setTile(this.x--, this.y, Tile.PLAYER_GROUND);
        this.inc_ground_share();
        this.map.setTile(this.x, this.y, Tile.PLAYER);
      }
    }
    else if(keyboard.keys[Keyboard.Keys.RIGHT])
    {
      if(this.can_move_to(1, 0))
      {
        this.map.setTile(this.x++, this.y, Tile.PLAYER_GROUND);
        this.inc_ground_share();
        this.map.setTile(this.x, this.y, Tile.PLAYER);
      }
    }

    if(keyboard.keys[Keyboard.Keys.UP])
    {
      if(this.can_move_to(0, -1))
      {
        this.map.setTile(this.x, this.y--, Tile.PLAYER_GROUND);
        this.inc_ground_share();
        this.map.setTile(this.x, this.y, Tile.PLAYER);
      }
    }
    else if(keyboard.keys[Keyboard.Keys.DOWN])
    {
      if(this.can_move_to(0, 1))
      {
        this.map.setTile(this.x, this.y++, Tile.PLAYER_GROUND);
        this.inc_ground_share();
        this.map.setTile(this.x, this.y, Tile.PLAYER);
      }
    }
  },
  can_move_to: function(dx, dy)
  {
    var new_x = this.x + dx;
    var new_y = this.y + dy;

    if(dx != 0.0 && (new_x < 0 || new_x >= this.map.w))
      return false;
    else if(dy != 0.0 && (new_y < 0 || new_y >= this.map.h))
      return false;
    
    var tile = this.map.getTile(new_x, new_y);
    return tile.type == Tile.GROUND || tile.type == Tile.PLAYER_GROUND;
  },
  inc_ground_share: function()
  {
    var tile = this.map.getTile(this.x, this.y);
    if(tile.type == Tile.GROUND)
      this.ground++;
  }
};

function Enemy()
{
  this.initialize.apply(this, arguments);
}
Enemy.prototype = 
{
  initialize: function(map)
  {
    this.map = map;
    this.dt = 0.0;
    this.ground = 0;

    this.enemies = [];

    for(var i=0; i<8; i++)
    {
      while(1) // FIXME: this could cause an infinite loop :)
      {
        var x = (Math.random() * map.w) | 0;
        var y = (Math.random() * map.h) | 0;

        if(x < 6 || y < 16)
          continue;

        var tile = map.getTile(x, y);
        if(tile.type == Tile.GROUND)
        {
          map.setTile(x, y, Tile.ENEMY);
          map.ground--;
          this.enemies.push({x: x, y: y});
          break;
        }
      }
    }
  },
  update: function(dt)
  {
    this.dt += dt;

    if(this.dt < 100)
      return;

    this.dt = 0;

    for(var i=0; i<this.enemies.length; i++)
    {
      var enemy = this.enemies[i];
      var can_move = true;

      while(can_move)
      {
        switch((Math.random() * 6) | 0)
        {
          case 1:
          {
            if(this.can_move_to(enemy, -1, 0))
            {
              this.map.setTile(enemy.x--, enemy.y, Tile.ENEMY_GROUND);
              this.inc_ground_share(enemy);
              this.map.setTile(enemy.x, enemy.y, Tile.ENEMY);
            }

            can_move = false;
          }
          break;

          case 2:
          {
            if(this.can_move_to(enemy, 1, 0))
            {
              this.map.setTile(enemy.x++, enemy.y, Tile.ENEMY_GROUND);
              this.inc_ground_share(enemy);
              this.map.setTile(enemy.x, enemy.y, Tile.ENEMY);
            }

            can_move = false;
          }
          break;

          case 3:
          {
            if(this.can_move_to(enemy, 0, -1))
            {
              this.map.setTile(enemy.x, enemy.y--, Tile.ENEMY_GROUND);
              this.inc_ground_share(enemy);
              this.map.setTile(enemy.x, enemy.y, Tile.ENEMY);
            }

            can_move = false;
          }
          break;

          case 4:
          {
            if(this.can_move_to(enemy, 0,  1))
            {
              this.map.setTile(enemy.x, enemy.y++, Tile.ENEMY_GROUND);
              this.inc_ground_share(enemy);
              this.map.setTile(enemy.x, enemy.y, Tile.ENEMY);
            }

            can_move = false;
          }
          break;
        }
      }
    }
  },
  can_move_to: function(enemy, dx, dy)
  {
    var new_x = enemy.x + dx;
    var new_y = enemy.y + dy;

    if(dx != 0.0 && (new_x < 0 || new_x >= this.map.w))
      return false;
    else if(dy != 0.0 && (new_y < 0 || new_y >= this.map.h))
      return false;
    
    var tile = this.map.getTile(new_x, new_y);
    return tile.type == Tile.GROUND || tile.type == Tile.ENEMY_GROUND;
  },
  inc_ground_share: function(enemy)
  {
    var tile = this.map.getTile(enemy.x, enemy.y);
    if(tile.type == Tile.GROUND)
      this.ground++;
  }
};

function Hud()
{
  this.initialize.apply(this, arguments);
}
Hud.prototype = 
{
  initialize: function(map, player, enemy)
  {
    this.map = map;
    this.player = player;
    this.enemy = enemy;
    this.player_color = Tile.type_to_color(Tile.PLAYER_GROUND);
    this.enemy_color = Tile.type_to_color(Tile.ENEMY_GROUND);
    this.enemy_pct = 0;
    this.player_pct = 0;
    this.remaining_pct = 100.0;
  },
  draw: function(ctx)
  {
    ctx.fillStyle = "#ffffff";
    ctx.font = "24 bold Arial";
    ctx.fillText("Nine Dots Dungeon", 32, 38);

    if(this.enemy_pct > this.remaining_pct)
    {
      ctx.fillStyle = this.enemy_color;
      ctx.fillText("Gamer Over!", 64, 68);
    }
    else if(this.player_pct > this.remaining_pct)
    {
      ctx.fillStyle = this.player_color;
      ctx.fillText("You won!", 74, 68);
    }
    else
    {
      ctx.fillStyle = this.player_color;
      ctx.fillText(this.player_pct + "%", 32, 68);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(this.remaining_pct + "%", 110, 68);
      ctx.fillStyle = this.enemy_color;
      ctx.fillText(this.enemy_pct + "%", 188, 68);
    }
  },
  update: function(dt)
  {
    this.enemy_pct = Math.ceil((this.enemy.ground * 100.0) / this.map.ground)
    this.player_pct = Math.ceil((this.player.ground * 100.0) / this.map.ground);
    this.remaining_pct = Math.ceil(100.0 - (this.enemy_pct + this.player_pct));
  }
};

function main()
{
  var last = new Date();
  var canvas = document.getElementById('canvas');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  var ctx = canvas.getContext('2d');

  var keyboard = new Keyboard(window);
  var bounds = new Rect(0, 0, canvas.width, canvas.height);
  var map = new Map(bounds);
  var player = new Player(map);
  var enemy = new Enemy(map);
  var hud = new Hud(map, player, enemy);

  function loop()
  {
    var now = new Date();
    var dt = now - last;
    last = now;

    player.update(dt, keyboard);
    enemy.update(dt);
    hud.update(dt);

    ctx.clearRect(0, 0, bounds.w, bounds.h);

    map.draw(ctx);
    hud.draw(ctx);

    keyboard.update(dt);

    requestAnimationFrame(loop);
  }

  loop();
}

window.onload = main;
