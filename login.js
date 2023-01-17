var loginPage = React.createClass({
    render: function() {
        let state = {};
        for (let setting of location.search.substring(1).split("&")) {
          let [key, value] = setting.split("=");
          state[key] = value;
        }
        // get url from environment variable 
        let URL = "https://127.00.0.1:8080";
  
        let client_id = "LocalDevelopmentServer";
        let redirect_uri = `${URL}/app`;
  
        console.log(redirect_uri);
        location.href = `https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/auth?response_type=code&login=true&client_id=${client_id}&redirect_uri=${redirect_uri}&state=${encodeURIComponent(
          JSON.stringify(state)
        )}`;
      return (
        <div>
          <title>Redirect page</title>
          <meta charSet="UTF-8" />
          Redirecting to IAM...
        </div>
      );
    }
  });