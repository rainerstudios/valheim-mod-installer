import React, { useState } from 'react';
import { IValheimMod } from '@/api/server/valheim/fetchMods';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faExternalLinkAlt, faThumbsUp } from '@fortawesome/free-solid-svg-icons';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import UninstallModal from '@/components/server/valheim/UninstallModal';

interface Props {
    mod: IValheimMod;
    onUpdate: () => void;
}

export default ({ mod, onUpdate }: Props) => {
    const [visible, setVisible] = useState(false);

    return (
        <div css={tw`bg-gray-600 hover:bg-gray-700 border-gray-700 border-2 rounded-md p-4 flex flex-col h-full cursor-pointer`} onClick={() => setVisible(true)}>
            <div css={tw`w-full`}>
                <img alt={'Logo'} src={mod.versions[0].icon} width={'80%'} css={tw`m-auto rounded-lg`} />
            </div>
            <div css={tw`flex justify-between py-2 text-sm`}>
                <span css={tw`flex gap-x-1 justify-center items-center`}>
                    <FontAwesomeIcon icon={faDownload} />
                    {mod.versions[0].downloads}
                </span>
                <span css={tw`flex gap-x-1 justify-center items-center`}>
                    <FontAwesomeIcon icon={faThumbsUp} />
                    {mod.ratingScore}
                </span>
            </div>
            <div css={tw`flex flex-wrap gap-x-2`}>
                <h1 css={tw`text-lg flex-1 min-w-0`}>{mod.name}</h1>
                <Tooltip content={'Open in Thunderstore'}>
                    <a href={mod.packageUrl} target={'_blank'} rel={'noreferrer'} css={tw`text-gray-200 hover:text-gray-100`} onClick={(event) => event.stopPropagation()}>
                        <FontAwesomeIcon icon={faExternalLinkAlt} />
                    </a>
                </Tooltip>
            </div>
            <div>
                <span css={tw`pr-1`}>By</span>
                <a
                    href={`https://thunderstore.io/c/valheim/p/${mod.owner}/`}
                    target={'_blank'}
                    rel={'noreferrer'}
                    css={tw`text-blue-500 hover:text-blue-600`}
                    onClick={(event) => event.stopPropagation()}
                >
                    {mod.owner}
                </a>
            </div>
            <p css={tw`pt-2`}>
                {mod.versions[0].description.substring(0, 150).trim()}
                {mod.versions[0].description.length > 150 ? '...' : ''}
            </p>
            <div css={tw`flex flex-wrap gap-2 pt-4 mt-auto`}>
                {mod.categories.map((category, key) => (
                    <span key={`category-${key}`} css={tw`bg-gray-500 text-white rounded-md px-1 text-xs`}>
                        {category}
                    </span>
                ))}
            </div>
            <div css={tw`text-sm pt-4`}>This mod includes {mod.dependencyCount} dependencies.</div>
            {visible && <UninstallModal mod={mod} onUpdate={onUpdate} onClose={() => setVisible(false)} />}
        </div>
    );
};
