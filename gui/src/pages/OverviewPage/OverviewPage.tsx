import { FunctionComponent } from 'react'
import Markdown from '../../Markdown/Markdown'
import overviewMd from './overview.md?raw'

type Props = {
    width: number
    height: number
}

const OverviewPage: FunctionComponent<Props> = ({width, height}) => {
    return (
        <div style={{ position: "absolute", width, height, overflowY: "auto" }}>
            <Markdown
                source={overviewMd}
            />
        </div>
    )
}

export default OverviewPage
