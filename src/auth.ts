import axios from 'axios';

export const auth = {
  access_token: '',
  refresh_token: '',
  access_token_refresh_interval: 1800
};

const refreshAccessTokenHelper = async () => {

  auth.refresh_token = process.env.CS_REFRESH_TOKEN!;

  if (auth.refresh_token) {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'refresh_token');
    formData.append('refresh_token', auth.refresh_token);

    try {
      const { data: { access_token, expires_in } } = await axios.post(
        process.env.CS_TOKEN_URL!,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization':
              `Basic ${Buffer.from(`${process.env.CS_CLIENT_ID}:${process.env.CS_CLIENT_SECRET}`).toString('base64')}`
          }
        }
      );

      auth.access_token = access_token;
      auth.access_token_refresh_interval = (parseInt(expires_in) - 300) * 1000 // ms;

    } catch (ex) {
      console.error(ex);
      throw ex;
    }
  }
};

export const refreshAccessToken = async () => {

  await refreshAccessTokenHelper();

  setInterval(refreshAccessTokenHelper, auth.access_token_refresh_interval);

};