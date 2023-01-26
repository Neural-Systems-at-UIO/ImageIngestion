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
const BrainList = ({ items, SetCurrentJob })  => {
    const onClick = (e) => {
      console.log('click ', e);
      SetCurrentJob(e.key);

    };

    
    return (
        <Menu
        onClick={onClick}
        style={{
            width: 256,
            "minHeight":"40vh" 
        }}
        defaultSelectedKeys={['1']}
        defaultOpenKeys={['sub1', 'sub2']}
        mode="inline"
        items={items}
        />
    );
    };

export default BrainList;
