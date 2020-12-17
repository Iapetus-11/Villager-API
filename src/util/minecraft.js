import axios from 'axios';

var mcstatusCache = {}; // {'server': {data}}

function clearCacheLoop() { // Clear old / outdated statuses from the cache
  Object.keys(mcstatusCache).forEach(key => {
    if ((new Date() - mcstatusCache[key].cacheTime) > 10) {
      console.log(`Clearing ${key} from the cache...`);
      delete mcstatusCache[key];
    }
  });
}

setInterval(clearCacheLoop, 1000); // Make clearCacheLoop run every second

export function mcstatus(mcserver) {
  return new Promise((resolve, reject) => {
    let cached = mcstatusCache[mcserver];

    if (cached) {
      resolve(cached);
    } else {
      axios.get('http://localhost:2304/mcstatus', {data: {mcserver: mcserver}})
      .then(res => {
        let status = {...res.data, cached: false, cache_time: null};

        resolve(status);

        // Insert into cache
        mcstatusCache[mcserver] = {...res.data, cached: true, cache_time: (new Date())};
      })
      .catch(e => reject(e));
    }
  });
}
