import React, { useEffect, useState } from 'react';
import tw from 'twin.macro';
import { Form, Formik, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import Switch from '@/components/elements/Switch';
import fetchMods, { IValheimMod, IValheimPagination, MockPagination } from '@/api/server/valheim/fetchMods';
import { ServerContext } from '@/state/server';
import { useFlashKey } from '@/plugins/useFlash';
import FlashMessageRender from '@/components/FlashMessageRender';
import { debounce } from 'debounce';
import Spinner from '@/components/elements/Spinner';
import ModBox from '@/components/server/valheim/ModBox';
import Pagination from '@/components/elements/Pagination';
import InstalledModsBox from '@/components/server/valheim/InstalledModsBox';

interface Props {
    onUpdate: () => void;
    disabled: boolean;
}

interface SearchValues {
    query: string;
    showNsfwContent: boolean;
    showDeprecated: boolean;
    installed: boolean;
}

export default ({ onUpdate, disabled }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [showDeprecated, setShowDeprecated] = useState(false);
    const [showNsfw, setShowNsfw] = useState(false);
    const [showInstalled, setShowInstalled] = useState(false);
    const [query, setQuery] = useState('');
    const [mods, setMods] = useState<IValheimMod[]>([]);
    const [pagination, setPagination] = useState<IValheimPagination>(MockPagination);

    const { clearAndAddHttpError, clearFlashes } = useFlashKey('server:valheim:mods');

    const listMods = (p: number, deprecated: boolean, nsfw: boolean, q: string) => {
        clearFlashes();
        setLoading(true);

        fetchMods(uuid, p, q, deprecated, nsfw)
            .then((data) => {
                setPagination(data.pagination);
                setMods(data.mods);
            })
            .catch((error) => clearAndAddHttpError(error))
            .finally(() => setLoading(false));
    };

    const onQueryChange = debounce((event: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(event.target.value);
        setPage(1);
    }, 500);

    const onSearch = (values: SearchValues, { setSubmitting }: FormikHelpers<SearchValues>) => {
        setPage(1);
        setQuery(values.query);
        setShowDeprecated(values.showDeprecated);
        setShowNsfw(values.showNsfwContent);
        setSubmitting(false);
    };

    useEffect(() => {
        listMods(page, showDeprecated, showNsfw, query);
    }, []);

    useEffect(() => {
        listMods(page, showDeprecated, showNsfw, query);
    }, [page, query, showNsfw, showDeprecated]);

    return (
        <div css={tw`pt-4`} style={disabled ? { filter: 'blur(4px)' } : {}}>
            <Formik
                initialValues={{
                    query: '',
                    showNsfwContent: false,
                    showDeprecated: false,
                    installed: false,
                }}
                onSubmit={onSearch}
            >
                {({ values, setFieldValue, isSubmitting, handleChange }) => (
                    <Form>
                        <div css={tw`flex flex-wrap gap-x-6 gap-y-4 justify-end`}>
                            <div css={tw`w-full flex-none md:flex-1`}>
                                <Field
                                    name={'query'}
                                    placeholder={'Enter here the mod name...'}
                                    readOnly={isSubmitting}
                                    disabled={values.installed || disabled}
                                    onChange={(event) => {
                                        onQueryChange(event);
                                        handleChange(event);
                                    }}
                                />
                            </div>
                            {!values.installed && (
                                <>
                                    <div css={tw`flex justify-center items-center`}>
                                        <Switch
                                            name={'showNsfwContent'}
                                            defaultChecked={values.showNsfwContent}
                                            readOnly={disabled}
                                            onChange={() => {
                                                setFieldValue('showNsfwContent', !values.showNsfwContent);
                                                setShowNsfw(!values.showNsfwContent);
                                                setPage(1);
                                            }}
                                        />
                                        <p css={tw`uppercase text-xs text-neutral-400 ml-2`}>Show NSFW</p>
                                    </div>
                                    <div css={tw`flex justify-center items-center`}>
                                        <Switch
                                            name={'showDeprecated'}
                                            defaultChecked={values.showDeprecated}
                                            readOnly={disabled}
                                            onChange={() => {
                                                setFieldValue('showDeprecated', !values.showDeprecated);
                                                setShowDeprecated(!values.showDeprecated);
                                                setPage(1);
                                            }}
                                        />
                                        <p css={tw`uppercase text-xs text-neutral-400 ml-2`}>Show deprecated</p>
                                    </div>
                                </>
                            )}
                            <div css={tw`flex justify-center items-center`}>
                                <Switch
                                    name={'installed'}
                                    defaultChecked={values.installed}
                                    readOnly={disabled}
                                    onChange={() => {
                                        setFieldValue('installed', !values.installed);
                                        setShowInstalled(!values.installed);
                                    }}
                                />
                                <p css={tw`uppercase text-xs text-neutral-400 ml-2`}>Installed</p>
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>
            <FlashMessageRender byKey={'server:valheim:mods'} className={'mt-4'} />
            {loading && <Spinner size={'large'} centered />}
            {!loading && (
                <div css={tw`pt-4`}>
                    {!showInstalled ? (
                        <Pagination
                            data={{
                                items: mods,
                                pagination: {
                                    total: 0,
                                    count: 0,
                                    perPage: pagination.countPerPage,
                                    currentPage: page,
                                    totalPages: pagination.totalPage,
                                },
                            }}
                            onPageSelect={setPage}
                        >
                            {({ items }) =>
                                items.length > 0 ? (
                                    <div css={tw`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2`}>
                                        {items.map((mod) => (
                                            <ModBox mod={mod} key={`mod-${mod.uuid4}`} disabled={disabled} onUpdate={onUpdate} />
                                        ))}
                                    </div>
                                ) : (
                                    <p css={tw`text-center text-sm text-neutral-400`}>There are no mods resulted for your query.</p>
                                )
                            }
                        </Pagination>
                    ) : (
                        <InstalledModsBox />
                    )}
                </div>
            )}
        </div>
    );
};
