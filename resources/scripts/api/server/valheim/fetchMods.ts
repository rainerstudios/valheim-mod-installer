import http from '@/api/http';

export interface IValheimModVersion {
    modUuid4: string;
    name: string;
    fullName: string;
    description: string;
    icon: string;
    versionNumber: string;
    downloadUrl: string;
    downloads: number;
    dateCreated: string;
    websiteUrl: string;
    isActive: boolean;
    uuid4: string;
    fileSize: number;
}

export const rawDataToValheimModVersion = (data: any): IValheimModVersion => ({
    modUuid4: data.mod_uuid4,
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    icon: data.icon,
    versionNumber: data.version_number,
    downloadUrl: data.download_url,
    downloads: data.downloads,
    dateCreated: data.date_created,
    websiteUrl: data.website_url,
    isActive: data.is_active,
    uuid4: data.uuid4,
    fileSize: data.file_size,
});

export interface IValheimMod {
    name: string;
    fullName: string;
    owner: string;
    packageUrl: string;
    donationLink: string;
    dateCreated: string;
    dateUpdated: string;
    uuid4: string;
    ratingScore: number;
    isPinned: boolean;
    isDeprecated: boolean;
    hasNsfwContent: boolean;
    categories: string[];
    versions: IValheimModVersion[];
    dependencyCount: number;
}

export const rawDataToValheimMod = (data: any): IValheimMod => ({
    name: data.name.replaceAll('_', ' '),
    fullName: data.full_name,
    owner: data.owner,
    packageUrl: data.package_url,
    donationLink: data.donation_link,
    dateCreated: data.date_created,
    dateUpdated: data.date_updated,
    uuid4: data.uuid4,
    ratingScore: data.rating_score,
    isPinned: data.is_pinned,
    isDeprecated: data.is_deprecated,
    hasNsfwContent: data.has_nsfw_content,
    categories: data.categories,
    versions: (data.versions || []).map(rawDataToValheimModVersion),
    dependencyCount: data.dependency_count ?? 0,
});

export interface IValheimPagination {
    currentPage: number;
    countPerPage: number;
    totalCount: number;
    totalPage: number;
}

export interface ValheimSearchResponse {
    mods: IValheimMod[];
    pagination: IValheimPagination;
}

export const MockPagination: IValheimPagination = {
    currentPage: 1,
    countPerPage: 10,
    totalCount: 0,
    totalPage: 0,
};

export default async (uuid: string, page: number, query: string, showDeprecated: boolean, showNsfw: boolean): Promise<ValheimSearchResponse> => {
    const { data } = await http.get(
        `/api/client/servers/${uuid}/valheim/search?page=${page}&show_deprecated=${showDeprecated ? 'true' : 'false'}&show_nsfw=${showNsfw ? 'true' : 'false'}&query=${encodeURI(
            query
        )}`
    );

    return {
        mods: (data.mods || []).map(rawDataToValheimMod),
        pagination: {
            currentPage: data.pagination.current_page,
            countPerPage: data.pagination.count_per_page,
            totalCount: data.pagination.total_count,
            totalPage: data.pagination.total_page,
        },
    };
};
