import http from '@/api/http';
import { IValheimModVersion, IValheimPagination, rawDataToValheimModVersion } from '@/api/server/valheim/fetchMods';

export interface ValheimModVersionsResponse {
    versions: IValheimModVersion[];
    pagination: IValheimPagination;
}

export default async (uuid: string, uuid4: string, page: number): Promise<ValheimModVersionsResponse> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/valheim/mods/${uuid4}/versions?page=${page}`);

    return {
        versions: (data.versions || []).map(rawDataToValheimModVersion),
        pagination: {
            currentPage: data.pagination.current_page,
            countPerPage: data.pagination.count_per_page,
            totalCount: data.pagination.total_count,
            totalPage: data.pagination.total_page,
        },
    };
};
