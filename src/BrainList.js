import { MailOutlined, SettingOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
function getItem(label, key, icon, children, type) {
  return {
    key,
    icon,
    children,
    label,
    type,
  };
}



// takes argument of itemsj
const BrainList = ({ items, CurrentJob, SetCurrentJob, selectedKeys, setSelectedKeys })  => {
    const onClick = (e) => {
      ;
      CurrentJob = e.key;
      SetCurrentJob(CurrentJob);
      console.log('brainlist currenet job', CurrentJob)
      setSelectedKeys([e.key]);

    };

    
    return (
        <Menu
        onClick={onClick}
        defaultSelectedKeys={['1']}
        defaultOpenKeys={['sub1', 'sub2']}
        selectedKeys={selectedKeys}
        mode="inline"
        items={items}
        />
    );
    };

export default BrainList;

