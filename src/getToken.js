

export function getToken(current_token) {
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    const urlParams = new URLSearchParams(window.location.search);

    const code = urlParams.get("code");


    // clear url
    // window.history.pushState({}, document.title, "/" );
    var redirect_uri = process.env.REACT_APP_URL;

    if (process.env.NODE_ENV === "development") {
      xhr.open("GET", `${redirect_uri}/auth?code=${code}`, true);
    } else {
      xhr.open("GET", `auth?code=${code}`, true);

    }


    xhr.send();
    xhr.onreadystatechange = function () {
      
      if (xhr.status == 200 && xhr.readyState == 4) {
        var resp = xhr.responseText;
        
        resolve(resp);
      }
      // handle rejection
      if (xhr.status == 400 && xhr.readyState == 4) {
        
        reject(xhr.status);
      }

    };
  });
}
