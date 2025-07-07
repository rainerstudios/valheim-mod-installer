import http from '@/api/http';

export default (uuid: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/valheim/install/cancel`)
            .then((data) => {
                resolve(data.data || []);
            })
            .catch(reject);
    });
};
