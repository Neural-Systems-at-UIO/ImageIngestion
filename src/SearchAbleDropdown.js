import { Select } from 'antd';
function SearchAbleDropdown( params ) {
  


  var currentBucket = params.currentBucket;
  console.log('currentBucket: ', currentBucket)
  return(
  <div
  style={{
    // width: 200,
    position: "absolute",
    top: '0.6rem',
    right: '2.5rem',
  }}
  >
  <label>Current Bucket:  &nbsp; </label>
  <Select
  defaultValue={currentBucket}
    showSearch
    style={{
      width: 200,
 
    }}
    // set label with currentBucket

    placeholder="Search to Select"
    optionFilterProp="children"
    // set value with currentBucket

    filterOption={(input, option) => (option?.label ?? '').includes(input)}
    filterSort={(optionA, optionB) =>
      (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
    }
    options={[
      // make bucket1 selected by default
      { label: currentBucket, value: currentBucket},
      { label: 'bucket2', value: 'bucket2' },

    ]}
  />
  </div>
  )
}
export default SearchAbleDropdown;