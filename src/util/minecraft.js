import axios from 'axios';

var mcstatusCache = {}; // {'server': {data}}

function clearCacheLoop() { // Clear old / outdated statuses from the cache
  Object.keys(mcstatusCache).forEach(key => {
    if ((new Date() - mcstatusCache[key].cacheTime)/1000 > 30) {
      delete mcstatusCache[key];
    }
  });
}

setInterval(clearCacheLoop, 1000); // Make clearCacheLoop run every second

export function mcstatus(mcserver) {
  return new Promise((resolve, reject) => {
    let cached = mcstatusCache[mcserver];

    if (cached) {
      return cached;
    } else {
      axios.get('http://localhost:2304/mcstatus', {data: {mcserver: mcserver}})
      .then(res => {
        let status = Object.assign(res.data, {cached: false, cacheTime: null});

        resolve(status);

        // Insert into cache
        mcstatusCache[mcserver] = Object.assign(Object.assign({}, res.data), {cached: true, cacheTime: (new Date())});
      })
      .catch(e => reject(e));
    }
  });
}
