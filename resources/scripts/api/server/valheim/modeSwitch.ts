import http from '@/api/http';

export default (uuid: string, mode: 'vanilla' | 'bepinex'): Promise<any> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/valheim/switch`, {
            mode,
        })
            .then((data) => {
                resolve(data.data || []);
            })
            .catch(reject);
    });
};
