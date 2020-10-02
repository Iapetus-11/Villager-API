
export function status(host, port, stop) {
  return new Promise((resolve, reject) => {
    Axios.get('http://localhost:2304/mcstatus', {data: {host: host, port: port}})
    .then(resp => {
      if (!resp.data.motd && !stop) {
        resolve(status(host, port, true));
      } else {
        resolve(resp.data);
      }
    })
    .catch(e => reject(e));
  });
}
