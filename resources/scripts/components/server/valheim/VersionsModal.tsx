import React, { useEffect, useState } from 'react';
import Modal from '@/components/elements/Modal';
import tw from 'twin.macro';
import { IValheimMod, IValheimModVersion, IValheimPagination, MockPagination } from '@/api/server/valheim/fetchMods';
import { useFlashKey } from '@/plugins/useFlash';
import fetchModVersions from '@/api/server/valheim/fetchModVersions';
import { ServerContext } from '@/state/server';
import Spinner from '@/components/elements/Spinner';
import GreyRowBox from '@/components/elements/GreyRowBox';
import Button from '@/components/elements/button/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import Code from '@/components/elements/Code';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import installModVersion from '@/api/server/valheim/installModVersion';
import ConfirmationDialog from '@/components/elements/dialog/ConfirmationDialog';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Alert } from '@/components/elements/alert';

interface Props {
    mod: IValheimMod;
    onUpdate: () => void;
    onClose: () => void;
}

export default ({ mod, onUpdate, onClose }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<IValheimPagination>(MockPagination);
    const [versions, setVersions] = useState<IValheimModVersion[]>([]);
    const [loading, setLoading] = useState(false);
    const [versionsVisible, setVersionsVisible] = useState(true);
    const [confirmationVisible, setConfirmationVisible] = useState(false);
    const [version, setVersion] = useState<undefined | IValheimModVersion>(undefined);
    const [confirmationLoading, setConfirmationLoading] = useState(false);

    const { clearAndAddHttpError, clearFlashes } = useFlashKey('server:valheim:mods:versions');

    const loadVersions = () => {
        clearFlashes();
        setLoading(true);

        fetchModVersions(uuid, mod.uuid4, page)
            .then((data) => {
                setVersions((current) => current.concat(data.versions));
                setPagination(data.pagination);
            })
            .catch((error) => clearAndAddHttpError(error))
            .finally(() => setLoading(false));
    };

    const loadMore = () => {
        setPage((current) => current + 1);
        loadVersions();
    };

    const startInstall = () => {
        setConfirmationLoading(true);

        installModVersion(uuid, mod.uuid4, version!.uuid4)
            .then(() => {
                onUpdate();
                onClose();
            })
            .catch((error) => {
                clearAndAddHttpError(error);
                setConfirmationLoading(false);
            });
    };

    useEffect(() => {
        loadVersions();

        return () => clearFlashes();
    }, []);

    return (
        <>
            <Modal
                visible={versionsVisible}
                onDismissed={() => {
                    if (version === undefined) {
                        onClose();
                    }
                }}
            >
                <FlashMessageRender byKey={'server:valheim:mods:versions'} css={tw`mb-2`} />
                <h2 css={tw`text-2xl mb-2 text-neutral-100`}>{mod.name}</h2>
                <p css={tw`mb-4`}>Check the available versions and start the installation process easily.</p>
                {versions.length < 1 && <Spinner size={'large'} centered />}
                {versions.length > 0 && (
                    <div>
                        <SpinnerOverlay visible={loading} />
                        {['r2modman', 'BepInExPack Valheim'].includes(mod.name) && (
                            <Alert type={'warning'} css={tw`mb-2`}>
                                {mod.name} is not available for install for server because it is not a mod.
                            </Alert>
                        )}
                        <div css={tw`flex justify-end pb-2`}>
                            <span css={tw`text-gray-400 text-sm`}>
                                Showing {page * 7} version from {pagination.totalCount} total.
                            </span>
                        </div>
                        <div css={tw`grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto`}>
                            {versions.map((version, key) => (
                                <GreyRowBox key={`version-${key}`} $hoverable>
                                    <div css={tw`w-full flex items-center`}>
                                        <div css={tw`flex-1 flex flex-row gap-4 lg:gap-7 2xl:gap-10`}>
                                            <div css={tw`flex flex-col`}>
                                                <span>Version</span>
                                                <Code css={tw`bg-gray-800`}>{version.versionNumber}</Code>
                                            </div>
                                            <div css={tw`flex flex-col`}>
                                                <span>Downloads</span>
                                                <Code css={tw`bg-gray-800`}>{version.downloads} pc.</Code>
                                            </div>
                                        </div>
                                        <Tooltip content={'Select & Install'}>
                                            <Button.Text
                                                type={'button'}
                                                size={1}
                                                disabled={['r2modman', 'BepInExPack Valheim'].includes(mod.name)}
                                                onClick={() => {
                                                    setVersion(version);
                                                    setVersionsVisible(false);
                                                    setConfirmationVisible(true);
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faDownload} />
                                            </Button.Text>
                                        </Tooltip>
                                    </div>
                                </GreyRowBox>
                            ))}
                            {pagination.totalPage >= page && (
                                <GreyRowBox onClick={() => loadMore()} $hoverable>
                                    Load more...
                                </GreyRowBox>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
            <ConfirmationDialog
                title={'Confirm install'}
                open={confirmationVisible}
                onClose={() => {
                    setConfirmationVisible(false);
                    setVersion(undefined);
                    clearFlashes();
                    setVersionsVisible(true);
                }}
                onConfirmed={() => startInstall()}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                buttonText={'Start & Install'}
                showSpinnerOverlay={confirmationLoading}
            >
                <FlashMessageRender byKey={'server:valheim:mods:versions'} css={tw`mb-2`} />
                Are you sure that you want to start to install{' '}
                <code>
                    {mod.name} {version?.versionNumber}
                </code>{' '}
                to this server? After you start the installation process, dependencies will be collected and you need to allow process again.
            </ConfirmationDialog>
        </>
    );
};
