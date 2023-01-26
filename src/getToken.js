

export function getToken() {

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    const urlParams = new URLSearchParams(window.location.search);

    const code = urlParams.get("code");

    // clear url
    //   window.history.pushState({}, document.title, "/" );
    if (process.env.NODE_ENV === "development") {
      var redirect_uri = process.env.REACT_APP_DEV_URL;
      xhr.open("GET", `${redirect_uri}/auth?code=${code}`, true);
    } else {
      var redirect_uri = process.env.REACT_APP_PROD_URL;
      xhr.open("GET", `auth?code=${code}`, true);

    }


    xhr.send();
    xhr.onreadystatechange = function () {
      if (xhr.status == 200 && xhr.readyState == 4) {
        var token = xhr.responseText;

        resolve(token);
      }

    };
  });
}
