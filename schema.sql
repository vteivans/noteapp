drop table if exists desktops;
create table desktops (
  id integer primary key autoincrement,
  ord integer,
  name text not null
);
drop table if exists notes;
create table notes (
  id integer primary key autoincrement,
  type text not null,
  desktop integer not null,
  content text not null,
  posx integer not null,
  posy integer not null,
  width integer,
  height integer,
  FOREIGN KEY(desktop) REFERENCES desktops(id)
);
insert into desktops (ord, name) values (1, 'Desktop one');
insert into notes(type, desktop, content, posx, posy) values('txt', 1, 'Hello world', 240, 10);
insert into notes(type, desktop, content, posx, posy, height) values('img', 1, 'http://fc01.deviantart.net/fs70/i/2010/326/6/2/portal_by_magicyio-d2nvet0.jpg', 240, 260, 244);