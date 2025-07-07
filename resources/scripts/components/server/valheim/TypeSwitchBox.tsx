import React, { useState } from 'react';
import tw from 'twin.macro';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import ValheimImage from '@/assets/images/valheim.png';
import ValheimBepinexImage from '@/assets/images/valheim-bepinex.png';
import ConfirmationDialog from '@/components/elements/dialog/ConfirmationDialog';
import { useFlashKey } from '@/plugins/useFlash';
import modeSwitch from '@/api/server/valheim/modeSwitch';
import { ServerContext } from '@/state/server';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { ValheimModsResponse } from '@/api/server/valheim/loadValheimMods';

interface Props {
    data: ValheimModsResponse;
    onModeSwitched: () => void;
}

export default ({ data, onModeSwitched }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:valheim');

    const handleModeSwitch = () => {
        clearFlashes();
        setLoading(true);

        modeSwitch(uuid, data.mode === 'vanilla' ? 'bepinex' : 'vanilla')
            .then(() => onModeSwitched())
            .catch((error) => clearAndAddHttpError(error))
            .finally(() => {
                setVisible(false);
                setLoading(false);
            });
    };

    return (
        <>
            <SpinnerOverlay visible={loading} />
            <div css={tw`grid grid-cols-1 lg:grid-cols-2 gap-4`}>
                <Tooltip content={data.mode === 'vanilla' ? 'Currently used' : 'Switch to Vanilla'}>
                    <div
                        css={[
                            tw`flex rounded-md px-2 py-1 gap-4`,
                            data.mode === 'vanilla' ? tw`bg-gray-700 border-green-800 border-4` : tw`gap-2 bg-gray-600 hover:bg-gray-700 border-gray-700 border-2 cursor-pointer`,
                        ]}
                        onClick={() => setVisible(data.mode !== 'vanilla')}
                    >
                        <div>
                            <img alt={'Valheim'} src={ValheimImage} css={tw`max-w-[100px]`} />
                        </div>
                        <div css={tw`justify-center content-center`}>
                            A Valheim server is for a vanilla multiplayer experience, ensuring compatibility with all base-game players.
                        </div>
                    </div>
                </Tooltip>
                <Tooltip content={data.mode === 'bepinex' ? 'Currently used' : 'Switch to BepInEx'}>
                    <div
                        css={[
                            tw`flex rounded-md px-2 py-1 gap-2`,
                            data.mode === 'bepinex' ? tw`bg-gray-700 border-green-800 border-4` : tw`gap-2 bg-gray-600 hover:bg-gray-700 border-gray-700 border-2 cursor-pointer`,
                        ]}
                        onClick={() => setVisible(data.mode !== 'bepinex')}
                    >
                        <div>
                            <img alt={'Valheim BepInEx'} src={ValheimBepinexImage} css={tw`max-w-[100px]`} />
                        </div>
                        <div css={tw`justify-center content-center`}>
                            A Valheim BepInEx server is needed for modding, requiring both server and clients to have BepInEx and the same mods.
                        </div>
                    </div>
                </Tooltip>
            </div>
            <ConfirmationDialog
                title={'Switch server mode'}
                open={visible}
                onClose={() => setVisible(false)}
                confirm={'Switch and Reinstall'}
                onConfirmed={() => handleModeSwitch()}
            >
                Are you sure that you want to switch <b>{data.mode === 'vanilla' ? 'Valheim BepInEx' : 'Valheim Vanilla'}?</b> Caution! The server will be reinstalled and all data
                will be lost.
            </ConfirmationDialog>
        </>
    );
};
