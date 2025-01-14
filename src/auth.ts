import axios from 'axios';

export const auth = {
  access_token: '',
  refresh_token: '',
  access_token_refresh_interval: 1800
};

export const refreshAccessToken = async () => {

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
      auth.access_token_refresh_interval = (parseInt(expires_in) - 600) * 1000 // ms;
      console.log(`********* refreshed access token... next refresh in ${auth.access_token_refresh_interval} ms`);

      setTimeout(() => {
        refreshAccessToken();
      }, auth.access_token_refresh_interval);

    } catch (ex) {
      console.error(ex);
      throw ex;
    }
  }
};