// Public historical Chromecast catalogue links. Photography rights remain with the credited authors.
// Source: https://github.com/dconnolly/chromecast-backgrounds
(function(){
  var photos=[
  {
    "url": "https://lh4.googleusercontent.com/-WbNq4f1kE7Y/Tu9tVtXGCYI/AAAAAAABFWY/N9NL1MKUt4A/s1920-w1920-h1080-c/DunesEdge.jpg",
    "author": "Joe Azure"
  },
  {
    "url": "https://lh5.googleusercontent.com/-6_QxmRRnJO8/TwjqsB2kshI/AAAAAAABFZw/__-irT00R2k/s1920-w1920-h1080-c/SealRocks-sunset-beach-rock.jpg",
    "author": "Joe Azure"
  },
  {
    "url": "https://lh6.googleusercontent.com/-YNlHO0F-y_U/UoazYeYqMvI/AAAAAAAAVqg/h8tLY6Zwktw/s1920-w1920-h1080-c/MoraineLake.jpg",
    "author": "Aravind Ravisankar"
  },
  {
    "url": "https://lh4.googleusercontent.com/-oMSn89uorIA/UktkPI4oEVI/AAAAAAAAVqo/d_0ZasIPfnc/s1920-w1920-h1080-c/PatriciaLake.jpg",
    "author": "Aravind Ravisankar"
  },
  {
    "url": "https://lh6.googleusercontent.com/-aqN5sgbqggQ/T3sLvuIoTmI/AAAAAAABFlQ/jxR2IgWbFM4/s1920-w1920-h1080-c/LandsEnds-le-sunset.jpg",
    "author": "Joe Azure"
  },
  {
    "url": "https://lh5.googleusercontent.com/-zcGhuTDGZ7Q/TvI44kbopOI/AAAAAAABFaY/677iL2Z8O8s/s1920-w1920-h1080-c/SutroSunset-surf-burn.jpg",
    "author": "Joe Azure"
  },
  {
    "url": "https://lh6.googleusercontent.com/-f6OToCJWRrg/UUsOySkJXoI/AAAAAAAATgk/DWwubrzxFPY/s1920-w1920-h1080-c/MountainSplendor.jpg",
    "author": "Alistair Nicol"
  },
  {
    "url": "https://lh6.googleusercontent.com/-Bm8YwGRxgzI/U0MfR72bkDI/AAAAAAAJKHE/TKs1mWF8US4/s1920-w1920-h1080-c/Trey%2BRatcliff%2B-%2BChina%2B2011%2B-%2BA%2BGreat%2BWall%2Bat%2BSunset.jpg",
    "author": "Trey Ratcliff"
  }
];
  var index=Math.floor(Math.random()*photos.length), changedAt=Date.now(), blocked={};
  function current(){
    if(Date.now()-changedAt>=600000){index=(index+1)%photos.length;changedAt=Date.now();blocked={};}
    for(var n=0;n<photos.length;n++){var p=photos[(index+n)%photos.length];if(!blocked[p.url])return p;}
    return null;
  }
  function failed(url){blocked[url]=true;}
  window.TVGallery={current:current,failed:failed};
})();
