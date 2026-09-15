import { describe, expect, it } from 'vitest'
import { buildCreateProductPayload, buildProductPayload } from './product-editor'

describe('product editor payload', () => {
  // CHG-0015：分类路径与品牌 ID 使用字符串雪花 ID
  const form = {
    code: ' PRODUCT-001 ',
    name: ' 示例商品 ',
    subtitle: ' 副标题 ',
    description: ' 商品描述 ',
    categoryId: ['1900000000000000010', '1900000000000000011'],
    brandId: '1900000000000000020',
  }

  it('TC-003: assembles images and attributes with exactly one main image', () => {
    const payload = buildProductPayload(
      form,
      [
        { objectKey: ' old-main ', imageUrl: ' https://img/old ', imageType: 'MAIN', sortOrder: 0, mainFlag: true },
        { objectKey: ' new-main ', imageUrl: ' https://img/new ', imageType: 'GALLERY', sortOrder: 1, mainFlag: false },
      ],
      [{ name: ' 材质 ', value: ' 铝合金 ', sortOrder: 0 }],
      1,
    )

    expect(payload.images).toEqual([
      { objectKey: 'old-main', imageUrl: 'https://img/old', imageType: 'GALLERY', sortOrder: 0, mainFlag: false },
      { objectKey: 'new-main', imageUrl: 'https://img/new', imageType: 'MAIN', sortOrder: 1, mainFlag: true },
    ])
    expect(payload.attributes).toEqual([{ name: '材质', value: '铝合金', sortOrder: 0 }])
    // 取级联路径末级作为归属分类，且雪花 ID 保持字符串不丢精度
    expect(payload.categoryId).toBe('1900000000000000011')
    expect(payload.brandId).toBe('1900000000000000020')
  })

  it('TC-004: includes specifications, price and image in the atomic create payload', () => {
    const base = buildProductPayload(form, [], [], -1)
    const payload = buildCreateProductPayload(form, base, [
      {
        skuCode: 'SKU-BLACK',
        specifications: [{ name: '颜色', value: '黑色' }],
        salePriceInCents: 12900,
        mainImageUrl: 'https://img/sku-black',
      },
    ])

    expect(payload.code).toBe('PRODUCT-001')
    expect(payload.skus).toEqual([
      {
        skuCode: 'SKU-BLACK',
        specifications: [{ name: '颜色', value: '黑色' }],
        salePriceInCents: 12900,
        mainImageUrl: 'https://img/sku-black',
      },
    ])
  })
})
