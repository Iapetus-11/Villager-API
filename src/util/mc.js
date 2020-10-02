
export function status(mcserver, stop) {
  return new Promise((resolve, reject) => {
    Axios.get('http://localhost:2304/mcstatus', {data: {mcserver: mcserver}})
    .then(resp => {
      if (!resp.data.motd && !stop) {
        resolve(status(mcserver, true));
      } else {
        resolve(resp.data);
      }
    })
    .catch(e => reject(e));
  });
}
